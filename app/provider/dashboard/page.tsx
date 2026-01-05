"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import { useApp } from "../../context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComplaintStatus, ProblemType, Complaint, Priority, ComplaintCategory, FileAttachment, ComplaintTimelineItem } from "../../types";
import Pagination from "../../components/Pagination";
import Loader from "../../components/Loader";
import {
  useComplaints,
  useComplaintStatuses,
  useComplaintTypes,
  useSortByOptions,
  useSearchComplaints,
} from "../../../lib/hooks";
import {
  useDashboardStats,
} from "../../../lib/hooks";

type CardType = "open" | "pending" | "resolved" | "refused";

interface DashboardStats {
  openComplaints: number;
  pendingFollowups: number;
  resolvedThisMonth: number;
  refusedComplaints: number;
}

export default function ProviderDashboard() {
  const router = useRouter();
  
  // Use React Query hooks for data fetching
  const { data: complaintsData, isLoading: complaintsLoading } = useComplaints();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: statusesData, isLoading: statusesLoading } = useComplaintStatuses();
  const { data: typesData, isLoading: typesLoading } = useComplaintTypes();
  const { data: sortByData } = useSortByOptions();
  
  // Extract data with fallbacks
  const storeComplaints = complaintsData || [];
  const storeStats = statsData?.stats || {
    openComplaints: 0,
    pendingFollowups: 0,
    resolvedThisMonth: 0,
    refusedComplaints: 0,
  };
  const storeStatuses = Array.isArray(statusesData) ? statusesData : [];
  const storeTypes = Array.isArray(typesData) ? typesData : [];
  const sortByOptions = Array.isArray(sortByData?.sort_by || sortByData?.data || sortByData)
    ? (sortByData?.sort_by || sortByData?.data || sortByData)
    : [];
  
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "All">("All");
  const [typeFilter, setTypeFilter] = useState<ProblemType | "All">("All");
  const [sortBy, setSortBy] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Build search filters for filtered complaints
  const searchFilters = useMemo(() => {
    const filters: {
      status_id?: number;
      type_id?: number;
    } = {};
    
    if (statusFilter !== "All") {
      const status = storeStatuses.find((s: Record<string, unknown>) => {
        const name = (s.name as string) || (s.status_name as string) || '';
        return name.toLowerCase() === statusFilter.toLowerCase();
      });
      const statusId = (status?.id as number) || (status?.status_id as number);
      if (statusId) filters.status_id = statusId;
    }
    
    if (typeFilter !== "All") {
      const type = storeTypes.find((t: Record<string, unknown>) => {
        const name = (t.name as string) || (t.type_name as string) || '';
        return name.toLowerCase() === typeFilter.toLowerCase();
      });
      const typeId = (type?.id as number) || (type?.type_id as number);
      if (typeId) filters.type_id = typeId;
    }
    
    return filters;
  }, [statusFilter, typeFilter, storeStatuses, storeTypes]);
  
  // Use search when filters are applied, otherwise use all complaints
  const hasFilters = Object.keys(searchFilters).length > 0;
  const { data: filteredComplaintsData, isLoading: searchLoading } = useSearchComplaints(
    hasFilters ? searchFilters : { general_search: "" }
  );
  
  // Determine which complaints to use
  const allComplaints = hasFilters 
    ? (filteredComplaintsData || [])
    : storeComplaints;
  
  const loading = complaintsLoading || statsLoading || statusesLoading || typesLoading || (hasFilters && searchLoading);

  // Use filtered complaints directly from store (fetched from API)
  const filteredAndSortedComplaints = useMemo(() => {
    let filtered = [...allComplaints];

    // Get the sort option details from sortByOptions
    const selectedSortOption = sortByOptions.find((option: Record<string, unknown>) => {
      const optionId = String(option.id || option.value || '');
      return optionId === sortBy;
    });

    // Determine sort type from option (check code, value, or label)
    const sortType = selectedSortOption 
      ? (String(selectedSortOption.code || selectedSortOption.value || selectedSortOption.label || '')).toLowerCase()
      : 'date'; // Default to date sorting

    // Apply client-side sorting based on selected option
    filtered.sort((a, b) => {
      // Sort by date (newest first)
      if (sortType.includes('date') || sortType.includes('newest') || sortType.includes('oldest')) {
        const dateA = new Date(a.dateSubmitted).getTime();
        const dateB = new Date(b.dateSubmitted).getTime();
        return sortType.includes('oldest') ? dateA - dateB : dateB - dateA;
      }
      // Sort by status
      else if (sortType.includes('status')) {
        const statusOrder: Record<ComplaintStatus, number> = {
          Open: 1,
          "In Progress": 2,
          Closed: 3,
          Refused: 4,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      // Sort by priority
      else if (sortType.includes('priority')) {
        const priorityOrder: Record<Priority, number> = {
          Low: 1,
          Medium: 2,
          High: 3,
          Urgent: 4,
        };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Sort by type
      else if (sortType.includes('type')) {
        return a.typeOfProblem.localeCompare(b.typeOfProblem);
      }
      // Default: sort by date (newest first)
      else {
        return (
          new Date(b.dateSubmitted).getTime() -
          new Date(a.dateSubmitted).getTime()
        );
      }
    });

    return filtered;
  }, [allComplaints, sortBy, sortByOptions]);

  const totalPages = Math.ceil(
    filteredAndSortedComplaints.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComplaints = filteredAndSortedComplaints.slice(
    startIndex,
    endIndex
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, sortBy]);

  // Set default sortBy when options are loaded
  useEffect(() => {
    if (sortByOptions.length > 0 && !sortBy) {
      const firstSortOption = sortByOptions[0] as Record<string, unknown>;
            const firstOptionId = String(firstSortOption.id || firstSortOption.value || '');
            setSortBy(firstOptionId);
    }
  }, [sortByOptions, sortBy]);

  // Removed - now handled by React Query hooks

  // Map API status to ComplaintStatus
  const mapStatus = (status: string | number): ComplaintStatus => {
    if (typeof status === 'number') {
      // If status is a number (status_id), map it
      const statusMap: Record<number, ComplaintStatus> = {
        1: 'Open',
        2: 'In Progress',
        3: 'Closed',
        4: 'Refused',
      };
      return statusMap[status] || 'Open';
    }
    
    // If status is a string, normalize it
    const statusStr = status?.toLowerCase() || '';
    if (statusStr.includes('open')) return 'Open';
    if (statusStr.includes('progress') || statusStr.includes('pending')) return 'In Progress';
    if (statusStr.includes('closed') || statusStr.includes('resolved')) return 'Closed';
    if (statusStr.includes('refused') || statusStr.includes('rejected')) return 'Refused';
    return 'Open';
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-500 text-white";
      case "Open":
        return "text-blue-400";
      case "Closed":
        return "text-gray-400";
      case "Refused":
        return "bg-red-500 text-white";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    // Don't render badge if status is empty or undefined
    if (!status || status.trim() === '') {
      return null;
    }
    
    if (status === "In Progress") {
      return (
        <span
          style={{ color: "#2AB3EE", fontSize: "1.125rem", fontWeight: 600 }}
        >
          In Progress
        </span>
      );
    }
    if (status === "Refused") {
      return (
        <span className="inline-flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#FF3F3F" }}
          ></span>
          <span
            className="px-3 py-1.5 text-white rounded-full font-semibold"
            style={{ backgroundColor: "#FF3F3F", fontSize: "1rem" }}
          >
            Refused
          </span>
        </span>
      );
    }
    if (status === "Closed") {
      return (
        <span className="inline-flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#009200" }}
          ></span>
          <span
            style={{ color: "#009200", fontSize: "1.125rem", fontWeight: 600 }}
          >
            {status}
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: "#2AB3EE" }}
        ></span>
        <span
          style={{ color: "#2AB3EE", fontSize: "1.125rem", fontWeight: 600 }}
        >
          {status}
        </span>
      </span>
    );
  };

  const handleCardClick = (cardType: CardType) => {
    router.push(`/provider/dashboard/${cardType}`);
  };

  if (loading) {
    return (
      <Layout role="provider">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="provider">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-3"
              style={{ color: "#E6E6E6" }}
            >
              How can we help you?
            </h1>
            <p
              style={{
                color: "#E6E6E6",
                opacity: 0.8,
                fontSize: "1.25rem",
                lineHeight: "1.7",
              }}
            >
              You can review your complaints, check follow-up status, or submit
              a new concern.
            </p>
          </div>
          <Link
            href="/provider/complaints/new"
            className="text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 w-full md:w-auto"
            style={{
              backgroundColor: "#FF8800",
              fontSize: "1.25rem",
              padding: "18px 32px",
              minHeight: "60px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#E67700")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#FF8800")
            }
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Complaint
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
        <div
          onClick={() => handleCardClick("open")}
          className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#2AB3EE] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ transform: "translateZ(0)" }}
        >
          <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">
            Open Complaint
          </h3>
          <p className="font-bold text-white !text-4xl md:text-9xl leading-none">
            {storeStats.openComplaints}
          </p>
        </div>
        <div
          onClick={() => handleCardClick("pending")}
          className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#2AB3EE] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ transform: "translateZ(0)" }}
        >
          <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">
            Pending Follow-ups
          </h3>
          <p className="font-bold text-white !text-4xl md:text-9xl leading-none">
            {storeStats.pendingFollowups}
          </p>
        </div>
        <div
          onClick={() => handleCardClick("resolved")}
          className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#009200] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ transform: "translateZ(0)" }}
        >
          <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">
            Resolved This Month
          </h3>
          <p className="font-bold text-white !text-4xl md:text-9xl leading-none">
            {storeStats.resolvedThisMonth}
          </p>
        </div>
        <div
          onClick={() => handleCardClick("refused")}
          className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#FF3F3F] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ transform: "translateZ(0)" }}
        >
          <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">
            Refused Complaints
          </h3>
          <p className="font-bold text-white !text-4xl md:text-9xl leading-none">
            {storeStats.refusedComplaints}
          </p>
        </div>
      </div>

      {/* Complaints Table */}
      <div
        className="rounded-lg p-6 md:p-8"
        style={{ backgroundColor: "#2A2B30" }}
      >
        <div className="mb-6">
          <h2 className="text-3xl font-bold" style={{ color: "#E6E6E6" }}>
            My Complaints
          </h2>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label
              className="block mb-2"
              style={{ color: "#E6E6E6", fontSize: "1rem", fontWeight: 500 }}
            >
              Filter by Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as ComplaintStatus | "All");
              }}
            >
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-4 py-3 min-h-[52px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                <SelectItem
                  value="All"
                  className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                >
                  All Status
                </SelectItem>
                {storeStatuses.map((status: Record<string, unknown>) => {
                  const statusName = (status.label as string) || (status.name as string) || (status.status_name as string) || (status.code as string) || '';
                  const statusValue = mapStatus(statusName || String(status.id || ''));
                  if (!statusName) return null;
                  return (
                    <SelectItem
                      key={String(status.id || status.status_id || '')}
                      value={statusValue}
                      className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                    >
                      {statusName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label
              className="block mb-2"
              style={{ color: "#E6E6E6", fontSize: "1rem", fontWeight: 500 }}
            >
              Filter by Type
            </label>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                // Removed - React Query handles loading automatically(true);
                setTypeFilter(value as ProblemType | "All");
              }}
            >
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-4 py-3 min-h-[52px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                <SelectItem
                  value="All"
                  className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                >
                  All Types
                </SelectItem>
                {storeTypes.map((type: Record<string, unknown>) => {
                  const typeName = (type.name as string) || (type.type_name as string) || (type.code as string) || '';
                  // Map to ProblemType - convert "Late Arrival" to "Late arrival" for consistency
                  const typeValue = typeName === 'Late Arrival' ? 'Late arrival' : (typeName || 'Other') as ProblemType;
                  if (!typeName) return null;
                  return (
                    <SelectItem
                      key={String(type.id || type.type_id || '')}
                      value={typeValue}
                      className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                    >
                      {typeName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label
              className="block mb-2"
              style={{ color: "#E6E6E6", fontSize: "1rem", fontWeight: 500 }}
            >
              Sort By
            </label>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                // Removed - React Query handles loading automatically(true);
                setSortBy(value);
              }}
            >
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-4 py-3 min-h-[52px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                {sortByOptions.length > 0 ? (
                  sortByOptions.map((option: Record<string, unknown>) => {
                    const optionId = String(option.id || option.value || '');
                    const optionLabel = String(option.label || option.name || option.value || '');
                    if (!optionLabel) return null;
                    return (
                      <SelectItem
                        key={optionId}
                        value={optionId}
                        className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                      >
                        {optionLabel}
                      </SelectItem>
                    );
                  })
                ) : (
                  <>
                    <SelectItem value="date" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Date (Newest First)</SelectItem>
                    <SelectItem value="status" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Status</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 rounded-lg" style={{ backgroundColor: "#1F2022" }}>
              <Loader size="lg" />
            </div>
          ) : filteredAndSortedComplaints.length === 0 ? (
            <div
              className="text-center py-12 rounded-lg"
              style={{ backgroundColor: "#1F2022" }}
            >
              <p style={{ color: "#E6E6E6", fontSize: "1.25rem" }}>
                {allComplaints.length === 0
                  ? "No complaints yet. Create your first complaint!"
                  : "No complaints match your filters."}
              </p>
            </div>
          ) : (
            paginatedComplaints.map((complaint) => (
              <div
                key={complaint.id}
                onClick={() =>
                  router.push(`/provider/complaints/${complaint.id}`)
                }
                className="rounded-lg p-4 cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: "#1F2022",
                  border: "2px solid #E6E6E6",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#2A2B30";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(42, 179, 238, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1F2022";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3
                      className="font-bold mb-2"
                      style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                    >
                      {complaint.complaintId}
                    </h3>
                    <p
                      className="mb-2"
                      style={{
                        color: "#E6E6E6",
                        fontSize: "1rem",
                        opacity: 0.8,
                      }}
                    >
                      <span className="font-semibold">Caretaker:</span>{" "}
                      {complaint.caretaker}
                    </p>
                    <div className="mb-2">
                      {getStatusBadge(complaint.status)}
                    </div>
                    <p
                      className="mb-3"
                      style={{
                        color: "#E6E6E6",
                        fontSize: "0.875rem",
                        opacity: 0.7,
                      }}
                    >
                      <span className="font-semibold">Last Update:</span>{" "}
                      {complaint.lastUpdate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/provider/complaints/${complaint.id}`);
                  }}
                  className="w-full text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  style={{
                    backgroundColor: "#2AB3EE",
                    fontSize: "1.125rem",
                    padding: "12px 20px",
                    minHeight: "48px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#1F8FD0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#2AB3EE")
                  }
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>View Details</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{ borderBottomColor: "#E6E6E6", borderWidth: "2px" }}
                className="border-b"
              >
                <th
                  className="text-left py-4 px-4 font-semibold"
                  style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                >
                  Complaint ID
                </th>
                <th
                  className="text-left py-4 px-4 font-semibold"
                  style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                >
                  Caretaker
                </th>
                <th
                  className="text-left py-4 px-4 font-semibold"
                  style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                >
                  Status
                </th>
                <th
                  className="text-left py-4 px-4 font-semibold"
                  style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                >
                  Last Update
                </th>
                <th
                  className="text-left py-4 px-4 font-semibold"
                  style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <Loader size="lg" />
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedComplaints.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12"
                    style={{ color: "#E6E6E6", fontSize: "1.25rem" }}
                  >
                    {allComplaints.length === 0
                      ? "No complaints yet. Create your first complaint!"
                      : "No complaints match your filters."}
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    onClick={() =>
                      router.push(`/provider/complaints/${complaint.id}`)
                    }
                    style={{ borderBottomColor: "#E6E6E6", borderWidth: "1px" }}
                    className="border-b transition-colors cursor-pointer"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2A2B30";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td
                      className="py-5 px-4 font-semibold"
                      style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                    >
                      {complaint.complaintId}
                    </td>
                    <td
                      className="py-5 px-4"
                      style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                    >
                      {complaint.caretaker}
                    </td>
                    <td className="py-5 px-4">
                      {getStatusBadge(complaint.status)}
                    </td>
                    <td
                      className="py-5 px-4"
                      style={{ color: "#E6E6E6", fontSize: "1rem" }}
                    >
                      {complaint.lastUpdate}
                    </td>
                    <td className="py-5 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/provider/complaints/${complaint.id}`);
                        }}
                        className="text-white rounded-lg flex items-center gap-2 transition-colors"
                        style={{
                          backgroundColor: "#2A2B30",
                          fontSize: "1.125rem",
                          padding: "12px 20px",
                          minHeight: "48px",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#1F2022")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "#2A2B30")
                        }
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAndSortedComplaints.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredAndSortedComplaints.length}
          />
        )}
      </div>
    </Layout>
  );
}
