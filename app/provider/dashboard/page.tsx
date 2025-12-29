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
import { dashboardService, complaintService } from "../../../lib/services";
import Loader from "../../components/Loader";
import { useDashboardStore } from "../../../lib/stores/dashboardStore";

type CardType = "open" | "pending" | "resolved" | "refused";

interface DashboardStats {
  openComplaints: number;
  pendingFollowups: number;
  resolvedThisMonth: number;
  refusedComplaints: number;
}

export default function ProviderDashboard() {
  const router = useRouter();
  
  // Use Zustand store instead of local state
  const {
    stats,
    complaints,
    statuses,
    types,
    setStats,
    setComplaints,
    setStatuses,
    setTypes,
    isStatsStale,
    isComplaintsStale,
    isMetadataStale,
  } = useDashboardStore();
  
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "All">("All");
  const [typeFilter, setTypeFilter] = useState<ProblemType | "All">("All");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Use store values with fallbacks
  const storeStats = stats || {
    openComplaints: 0,
    pendingFollowups: 0,
    resolvedThisMonth: 0,
    refusedComplaints: 0,
  };
  const storeComplaints = complaints || [];
  const storeStatuses = statuses || [];
  const storeTypes = types || [];

  // Use filtered complaints directly from store (fetched from API)
  const filteredAndSortedComplaints = useMemo(() => {
    let filtered = [...storeComplaints];

    // Apply client-side sorting (API may not support sorting)
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.dateSubmitted).getTime() -
          new Date(a.dateSubmitted).getTime()
        );
      } else {
        const statusOrder: Record<ComplaintStatus, number> = {
          Open: 1,
          "In Progress": 2,
          Closed: 3,
          Refused: 4,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      }
    });

    return filtered;
  }, [storeComplaints, sortBy]);

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

  // Helper function to map complaints from API response
  const mapComplaintsFromResponse = (complaintsResponse: any): Complaint[] => {
    const apiComplaints = complaintsResponse?.complaints || complaintsResponse?.payload || complaintsResponse?.data || complaintsResponse;
    const complaintsList = Array.isArray(apiComplaints) ? apiComplaints : [];
    
    return complaintsList.map((item: Record<string, unknown>) => {
      // Get the latest status from history array
      const history = (item.history as Array<Record<string, unknown>>) || [];
      const latestStatus = history.length > 0 
        ? (history[history.length - 1].status as Record<string, unknown>)
        : null;
      const statusLabel = latestStatus?.label as string || "Open";
      
      // Get type from type object
      const typeObj = item.type as Record<string, unknown> || {};
      const typeName = (typeObj.name as string) || (typeObj.code as string) || "Other";
      
      // Get priority from priority object
      const priorityObj = item.priority as Record<string, unknown> || {};
      const priorityLabel = (priorityObj.label as string) || "Medium";
      
      // Get files/attachments
      const files = (item.files as Array<Record<string, unknown>>) || [];
      const attachments: FileAttachment[] = files.map((file: Record<string, unknown>) => ({
        id: String(file.id || ''),
        name: (file.file_name as string) || '',
        url: (file.url as string) || '',
        type: (file.type as string) || 'image',
        size: 0,
        uploadedBy: '',
        uploadedAt: new Date().toISOString(),
      }));
      
      // Map timeline from history
      const timeline: ComplaintTimelineItem[] = history.map((hist: Record<string, unknown>) => {
        const statusObj = hist.status as Record<string, unknown> || {};
        const statusLabel = statusObj.label as string || 'Unknown';
        const statusCode = statusObj.code as string || '';
        return {
          status: statusLabel,
          date: new Date().toISOString(),
          description: (hist["Handler Remarks"] as string) || '',
          isCompleted: statusCode === 'closed',
          isRefused: statusCode === 'refused',
          userName: (hist["Case Handle By"] as string) || undefined,
        };
      });
      
      return {
        id: String(item.id || Date.now()),
        complaintId: `CMP-${item.id}`,
        caretaker: String(item.Complainant || item.caretaker_name || item.client_name || "Unknown"),
        typeOfProblem: (typeName === "Late Arrival" ? "Late arrival" : typeName) as ProblemType,
        description: String(item.description || ""),
        dateSubmitted: new Date().toLocaleDateString(),
        lastUpdate: new Date().toLocaleDateString(),
        status: mapStatus(statusLabel),
        priority: priorityLabel as Priority,
        category: undefined,
        tags: [],
        attachments: attachments,
        timeline: timeline,
      };
    });
  };

  // Fetch complaints with filters (for filter changes, doesn't set loading)
  const fetchComplaints = async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setLoading(true);
      }
      
      // Build search filters
      const searchFilters: Record<string, number> = {};
      
      // Get status ID if filter is set
      if (statusFilter !== "All") {
        const status = storeStatuses.find((s: Record<string, unknown>) => {
          const name = (s.name as string) || (s.status_name as string) || '';
          return name.toLowerCase() === statusFilter.toLowerCase();
        });
        const statusId = (status?.id as number) || (status?.status_id as number);
        if (statusId) searchFilters.status_id = statusId;
      }
      
      // Get type ID if filter is set
      if (typeFilter !== "All") {
        const type = storeTypes.find((t: Record<string, unknown>) => {
          const name = (t.name as string) || (t.type_name as string) || '';
          return name.toLowerCase() === typeFilter.toLowerCase();
        });
        const typeId = (type?.id as number) || (type?.type_id as number);
        if (typeId) searchFilters.type_id = typeId;
      }

      // Use advance search if filters are applied, otherwise get all
      let complaintsResponse;
      if (Object.keys(searchFilters).length > 0) {
        complaintsResponse = await complaintService.search(searchFilters);
      } else {
        complaintsResponse = await complaintService.getAll();
      }

      const mappedComplaints = mapComplaintsFromResponse(complaintsResponse);
      setComplaints(mappedComplaints); // Update Zustand store
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  };

  // Fetch all dashboard data on mount - ALL APIs in parallel
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch ALL data in parallel using Promise.all - best practice
        const [statsResponse, statusesResponse, typesResponse, complaintsResponse] = await Promise.all([
          dashboardService.getStats(),
          complaintService.getStatuses().catch(() => ({ data: [] })),
          complaintService.getTypes().catch(() => ({ data: [] })),
          complaintService.getAll().catch(() => ({ complaints: [] })),
        ]);

        // Map dashboard stats from API response
        // API returns: { status: true, states: { open_complaints, pending_followups, ... } }
        const apiStats = statsResponse?.states || statsResponse?.payload || statsResponse?.data || statsResponse;
        setStats({
          openComplaints: apiStats?.open_complaints || apiStats?.open || 0,
          pendingFollowups: apiStats?.pending_followups || apiStats?.pending || 0,
          resolvedThisMonth: apiStats?.resolved_this_month || apiStats?.resolved || 0,
          refusedComplaints: apiStats?.refused_complaints || apiStats?.refused || 0,
        });

        // Map statuses and types
        const apiStatuses = statusesResponse?.payload || statusesResponse?.data || statusesResponse;
        const statusesList = Array.isArray(apiStatuses) ? apiStatuses : [];
        setStatuses(statusesList as Array<Record<string, unknown>>);

        const apiTypes = typesResponse?.payload || typesResponse?.data || typesResponse;
        const typesList = Array.isArray(apiTypes) ? apiTypes : [];
        setTypes(typesList as Array<Record<string, unknown>>);

        // Map complaints from the parallel fetch
        const mappedComplaints = mapComplaintsFromResponse(complaintsResponse);
        setComplaints(mappedComplaints);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch complaints when filters change (skip loading state to avoid flicker)
  useEffect(() => {
    // Only refetch if statuses/types have been initialized (even if empty)
    // Skip loading state to prevent loader flicker on filter changes
    if (storeStatuses.length >= 0 && storeTypes.length >= 0) {
      fetchComplaints(true); // skipLoading = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

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
              onValueChange={(value) =>
                setStatusFilter(value as ComplaintStatus | "All")
              }
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
                  const statusName = (status.name as string) || (status.status_name as string) || '';
                  const statusValue = mapStatus(statusName || String(status.id || ''));
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
              onValueChange={(value) =>
                setTypeFilter(value as ProblemType | "All")
              }
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
                  const typeName = (type.name as string) || (type.type_name as string) || '';
                  // Map to ProblemType if it matches, otherwise use the name
                  const typeValue = (['Late arrival', 'Behavior', 'Missed service', 'Other'].includes(typeName) 
                    ? typeName 
                    : 'Other') as ProblemType;
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
              onValueChange={(value) => setSortBy(value as "date" | "status")}
            >
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-4 py-3 min-h-[52px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                <SelectItem
                  value="date"
                  className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                >
                  Date (Newest First)
                </SelectItem>
                <SelectItem
                  value="status"
                  className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                >
                  Status
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredAndSortedComplaints.length === 0 ? (
            <div
              className="text-center py-12 rounded-lg"
              style={{ backgroundColor: "#1F2022" }}
            >
              <p style={{ color: "#E6E6E6", fontSize: "1.25rem" }}>
                {complaints.length === 0
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
              {filteredAndSortedComplaints.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12"
                    style={{ color: "#E6E6E6", fontSize: "1.25rem" }}
                  >
                    {complaints.length === 0
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
