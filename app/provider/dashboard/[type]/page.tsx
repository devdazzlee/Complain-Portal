"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../../components/Layout";
import { useDashboardStore } from "../../../../lib/stores/dashboardStore";
import { complaintService } from "../../../../lib/services";
import { ComplaintStatus, Complaint, ProblemType, Priority, FileAttachment, ComplaintTimelineItem } from "../../../types";
import Pagination from "../../../components/Pagination";
import Loader from "../../../components/Loader";

type CardType = "open" | "pending" | "resolved" | "refused";

export default function DashboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { complaints: storeComplaints, setComplaints, isComplaintsStale } = useDashboardStore();
  const type = params.type as CardType;
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Map complaints from API response (same as dashboard)
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
      
      // Map status
      const statusStr = statusLabel?.toLowerCase() || '';
      let mappedStatus: ComplaintStatus = 'Open';
      if (statusStr.includes('open')) mappedStatus = 'Open';
      else if (statusStr.includes('progress') || statusStr.includes('pending')) mappedStatus = 'In Progress';
      else if (statusStr.includes('closed') || statusStr.includes('resolved')) mappedStatus = 'Closed';
      else if (statusStr.includes('refused') || statusStr.includes('rejected')) mappedStatus = 'Refused';
      
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
      
      // Get dates from API
      const createdAt = item.created_at as string || item.createdAt as string || '';
      const updatedAt = item.updated_at as string || item.updatedAt as string || '';
      const dateSubmitted = createdAt 
        ? new Date(createdAt).toLocaleDateString() 
        : new Date().toLocaleDateString();
      const lastUpdate = updatedAt 
        ? new Date(updatedAt).toLocaleDateString() 
        : (history.length > 0 ? new Date().toLocaleDateString() : dateSubmitted);

      return {
        id: String(item.id || Date.now()),
        complaintId: `CMP-${item.id}`,
        caretaker: String(item.Complainant || item.caretaker_name || item.client_name || "Unknown"),
        typeOfProblem: (typeName === "Late Arrival" ? "Late arrival" : typeName) as ProblemType,
        description: String(item.description || ""),
        dateSubmitted: dateSubmitted,
        lastUpdate: lastUpdate,
        status: mappedStatus,
        priority: priorityLabel as Priority,
        category: undefined,
        tags: [],
        attachments: attachments,
        timeline: timeline,
      };
    });
  };

  // Fetch complaints from API if stale or not available
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        if (isComplaintsStale() || storeComplaints.length === 0) {
          setLoading(true);
          const response = await complaintService.getAll();
          const mappedComplaints = mapComplaintsFromResponse(response);
          setComplaints(mappedComplaints);
        }
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use store complaints
  const complaints = storeComplaints || [];

  const getFilteredComplaints = (cardType: CardType): Complaint[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (cardType) {
      case "open":
        return complaints.filter(
          (c) => c.status === "Open" || c.status === "In Progress"
        );
      case "pending":
        return complaints.filter((c) => c.status === "In Progress");
      case "resolved":
        return complaints.filter((c) => {
          if (c.status !== "Closed") return false;
          const date = new Date(c.dateSubmitted);
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        });
      case "refused":
        return complaints.filter((c) => c.status === "Refused");
      default:
        return [];
    }
  };

  const getPageTitle = (cardType: CardType): string => {
    switch (cardType) {
      case "open":
        return "Open Complaints";
      case "pending":
        return "Pending Follow-ups";
      case "resolved":
        return "Resolved This Month";
      case "refused":
        return "Refused Complaints";
      default:
        return "Complaints";
    }
  };

  const getPageDescription = (cardType: CardType): string => {
    switch (cardType) {
      case "open":
        return "All open and in-progress complaints that require attention.";
      case "pending":
        return "Complaints that are currently being processed and require follow-up.";
      case "resolved":
        return "Complaints that have been successfully resolved this month.";
      case "refused":
        return "Complaints that have been refused by the supervisor.";
      default:
        return "Complaint details.";
    }
  };

  const getCardColor = (cardType: CardType): string => {
    switch (cardType) {
      case "open":
        return "#2AB3EE";
      case "pending":
        return "#2AB3EE";
      case "resolved":
        return "#009200";
      case "refused":
        return "#FF3F3F";
      default:
        return "#2AB3EE";
    }
  };

  const filteredComplaints = useMemo(() => {
    if (!type || !["open", "pending", "resolved", "refused"].includes(type)) {
      return [];
    }
    return getFilteredComplaints(type).sort((a, b) => {
      return (
        new Date(b.dateSubmitted).getTime() -
        new Date(a.dateSubmitted).getTime()
      );
    });
  }, [type, complaints]);

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);

  // Reset to page 1 when type changes
  useEffect(() => {
    setCurrentPage(1);
  }, [type]);

  if (loading) {
    return (
      <Layout role="provider">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

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

  if (!type || !["open", "pending", "resolved", "refused"].includes(type)) {
    return (
      <Layout role="provider">
        <div className="text-center py-16">
          <p
            style={{
              color: "#E6E6E6",
              fontSize: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            Invalid page
          </p>
          <Link
            href="/provider/dashboard"
            className="rounded-lg font-semibold transition-colors inline-block"
            style={{
              color: "#2AB3EE",
              fontSize: "1.125rem",
              padding: "14px 28px",
              minHeight: "56px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1F8FD0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#2AB3EE")}
          >
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="provider">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/provider/dashboard")}
              className="text-[#E6E6E6] hover:text-white transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex-1">
              <h1
                className="text-4xl md:text-5xl font-bold mb-3"
                style={{ color: "#E6E6E6" }}
              >
                {getPageTitle(type)}
              </h1>
              <p
                style={{
                  color: "#E6E6E6",
                  opacity: 0.8,
                  fontSize: "1.25rem",
                  lineHeight: "1.7",
                }}
              >
                {getPageDescription(type)}
              </p>
            </div>
          </div>

          {/* Stats Banner */}
          <div
            className="rounded-lg p-8 md:p-10 flex items-center justify-between"
            style={{ backgroundColor: getCardColor(type) }}
          >
            <div>
              <p className="text-[#E6E6E6] text-base! md:text-lg! lg:text-xl! mb-4 font-semibold">
                Total Complaints
              </p>
              <p className="font-bold text-white text-2xl! md:text-3xl! lg:text-4xl! leading-none">
                {filteredComplaints.length}
              </p>
            </div>
            <div className="hidden md:block">
              <svg
                className="w-24 h-24 opacity-20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div
          className="rounded-lg p-6 md:p-8"
          style={{ backgroundColor: "#2A2B30" }}
        >
          {filteredComplaints.length === 0 ? (
            <div
              className="text-center py-16 rounded-lg"
              style={{ backgroundColor: "#1F2022" }}
            >
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "#E6E6E6" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p
                style={{
                  color: "#E6E6E6",
                  fontSize: "1.25rem",
                  marginBottom: "1rem",
                }}
              >
                No complaints found in this category.
              </p>
              <Link
                href="/provider/complaints/new"
                className="inline-block text-white rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: "#FF8800",
                  fontSize: "1.125rem",
                  padding: "12px 24px",
                  minHeight: "48px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#E67700")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#FF8800")
                }
              >
                Create New Complaint
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {paginatedComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    onClick={() =>
                      router.push(`/provider/complaints/${complaint.id}`)
                    }
                    className="rounded-lg p-5 cursor-pointer transition-all duration-200"
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
                    <div className="mb-4">
                      <h3
                        className="font-bold mb-3"
                        style={{ color: "#E6E6E6", fontSize: "1.25rem" }}
                      >
                        {complaint.complaintId}
                      </h3>
                      <div className="space-y-2 mb-4">
                        <p style={{ color: "#E6E6E6", fontSize: "1rem" }}>
                          <span className="font-semibold">Caretaker:</span>{" "}
                          {complaint.caretaker}
                        </p>
                        <p style={{ color: "#E6E6E6", fontSize: "1rem" }}>
                          <span className="font-semibold">Type:</span>{" "}
                          {complaint.typeOfProblem}
                        </p>
                        {complaint.category && (
                          <p style={{ color: "#E6E6E6", fontSize: "1rem" }}>
                            <span className="font-semibold">Category:</span>{" "}
                            {complaint.category}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold"
                            style={{ color: "#E6E6E6" }}
                          >
                            Status:
                          </span>
                          {getStatusBadge(complaint.status)}
                        </div>
                        <p
                          style={{
                            color: "#E6E6E6",
                            fontSize: "0.875rem",
                            opacity: 0.7,
                          }}
                        >
                          <span className="font-semibold">Submitted:</span>{" "}
                          {new Date(complaint.dateSubmitted).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                        <p
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
                      {complaint.description && (
                        <div
                          className="mb-4 p-3 rounded"
                          style={{ backgroundColor: "#2A2B30" }}
                        >
                          <p
                            className="font-semibold mb-2"
                            style={{ color: "#E6E6E6" }}
                          >
                            Description:
                          </p>
                          <p
                            style={{
                              color: "#E6E6E6",
                              fontSize: "0.95rem",
                              opacity: 0.9,
                              lineHeight: "1.6",
                            }}
                          >
                            {complaint.description}
                          </p>
                        </div>
                      )}
                      {complaint.priority && (
                        <div className="mb-4">
                          <span
                            className="font-semibold mr-2"
                            style={{ color: "#E6E6E6" }}
                          >
                            Priority:
                          </span>
                          <span
                            className="px-3 py-1 rounded-full text-sm font-semibold"
                            style={{
                              backgroundColor:
                                complaint.priority === "Urgent"
                                  ? "#FF3F3F"
                                  : complaint.priority === "High"
                                  ? "#FF8800"
                                  : complaint.priority === "Medium"
                                  ? "#2AB3EE"
                                  : "#009200",
                              color: "#FFFFFF",
                            }}
                          >
                            {complaint.priority}
                          </span>
                        </div>
                      )}
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
                        padding: "14px 20px",
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
                      <span>View Full Details</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        borderBottomColor: "#E6E6E6",
                        borderWidth: "2px",
                      }}
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
                        Type
                      </th>
                      <th
                        className="text-left py-4 px-4 font-semibold"
                        style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                      >
                        Category
                      </th>
                      <th
                        className="text-left py-4 px-4 font-semibold"
                        style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                      >
                        Priority
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
                        Submitted
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
                    {paginatedComplaints.map((complaint) => (
                      <tr
                        key={complaint.id}
                        style={{
                          borderBottomColor: "#E6E6E6",
                          borderWidth: "1px",
                        }}
                        className="border-b transition-colors"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#1F2022")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
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
                        <td
                          className="py-5 px-4"
                          style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                        >
                          {complaint.typeOfProblem}
                        </td>
                        <td
                          className="py-5 px-4"
                          style={{ color: "#E6E6E6", fontSize: "1.125rem" }}
                        >
                          {complaint.category || "-"}
                        </td>
                        <td className="py-5 px-4">
                          {complaint.priority && (
                            <span
                              className="px-3 py-1 rounded-full text-sm font-semibold"
                              style={{
                                backgroundColor:
                                  complaint.priority === "Urgent"
                                    ? "#FF3F3F"
                                    : complaint.priority === "High"
                                    ? "#FF8800"
                                    : complaint.priority === "Medium"
                                    ? "#2AB3EE"
                                    : "#009200",
                                color: "#FFFFFF",
                              }}
                            >
                              {complaint.priority}
                            </span>
                          )}
                        </td>
                        <td className="py-5 px-4">
                          {getStatusBadge(complaint.status)}
                        </td>
                        <td
                          className="py-5 px-4"
                          style={{ color: "#E6E6E6", fontSize: "1rem" }}
                        >
                          {new Date(complaint.dateSubmitted).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="py-5 px-4">
                          <button
                            onClick={() =>
                              router.push(
                                `/provider/complaints/${complaint.id}`
                              )
                            }
                            className="text-white rounded-lg flex items-center gap-2 transition-colors"
                            style={{
                              backgroundColor: "#2A2B30",
                              fontSize: "1.125rem",
                              padding: "12px 20px",
                              minHeight: "48px",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1F2022")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#2A2B30")
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
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {filteredComplaints.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredComplaints.length}
          />
        )}
      </div>
    </Layout>
  );
}
