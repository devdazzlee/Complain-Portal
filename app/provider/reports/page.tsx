"use client";

import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { useApp } from "../../context/AppContext";
import { exportToCSV, exportToExcel } from "../../utils/export";
import Loader from "../../components/Loader";

export default function ReportsPage() {
  const { getReportData, complaints } = useApp();
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  
  // Initialize with a date range that includes sample data (last 3 months to ensure data is shown)
  const getInitialDateRange = () => {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 3);
    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const generateReport = () => {
    setLoading(true);
    setTimeout(() => {
      const data = getReportData(
        dateRange.start && dateRange.end ? dateRange : undefined
      );
      setReportData(data);
      setLoading(false);
    }, 500);
  };

  // Auto-generate report on page load
  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportCSV = () => {
    if (!reportData) return;
    setExportingCSV(true);
    const exportData = complaints.map((c) => ({
      "Complaint ID": c.complaintId,
      "Date Submitted": c.dateSubmitted,
      Caretaker: c.caretaker,
      Type: c.typeOfProblem,
      Category: c.category || "N/A",
      Priority: c.priority,
      Status: c.status,
      "Assigned To": c.assignedTo || "N/A",
      Description: c.description,
    }));
    exportToCSV(exportData, "complaints_report");
    setTimeout(() => setExportingCSV(false), 1000);
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    setExportingExcel(true);
    const exportData = complaints.map((c) => ({
      "Complaint ID": c.complaintId,
      "Date Submitted": c.dateSubmitted,
      Caretaker: c.caretaker,
      Type: c.typeOfProblem,
      Category: c.category || "N/A",
      Priority: c.priority,
      Status: c.status,
      "Assigned To": c.assignedTo || "N/A",
      Description: c.description,
    }));
    exportToExcel(exportData, "complaints_report");
    setTimeout(() => setExportingExcel(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "#2AB3EE";
      case "In Progress":
        return "#2AB3EE";
      case "Closed":
        return "#009200";
      case "Refused":
        return "#FF3F3F";
      default:
        return "#2A2B30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
      case "Urgent":
        return "#FF3F3F";
      case "Medium":
        return "#FF8800";
      case "Low":
        return "#2AB3EE";
      default:
        return "#2A2B30";
    }
  };

  return (
    <Layout role="provider">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        input[type="date"]::-webkit-calendar-picker-indicator {
          display: none;
        }
        input[type="date"]::-webkit-inner-spin-button,
        input[type="date"]::-webkit-clear-button {
          display: none;
        }
        .date-input-white::-webkit-calendar-picker-indicator {
          display: none;
        }
        .date-input-white::-webkit-inner-spin-button,
        .date-input-white::-webkit-clear-button {
          display: none;
        }
      `,
        }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8">
          <h1
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{ color: "#E6E6E6" }}
          >
          Reports & Analytics
        </h1>
          <p
            style={{
              color: "#E6E6E6",
              opacity: 0.8,
              fontSize: "1.25rem",
              lineHeight: "1.7",
            }}
          >
            Comprehensive insights and analytics for your complaint management
            system.
          </p>
        </div>

        {/* Date Range Filter */}
        <div
          className="rounded-lg p-5 md:p-6 lg:p-8 mb-6 md:mb-8"
          style={{
            backgroundColor: "#2A2B30",
            border: "1px solid rgba(230, 230, 230, 0.1)",
          }}
        >
          <h2
            className="text-xl md:text-2xl lg:text-3xl font-bold mb-5 md:mb-6"
            style={{ color: "#E6E6E6" }}
          >
            Filter by Date Range
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-5 md:mb-6">
            <div>
              <label
                className="block mb-2.5 text-base md:text-lg font-semibold"
                style={{ color: "#E6E6E6" }}
              >
                Start Date
              </label>
              <div className="relative">
                <input
                  ref={startDateRef}
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="w-full rounded-lg outline-none date-input-white transition-colors"
                  style={{
                    backgroundColor: "#1F2022",
                    border: "2px solid #E6E6E6",
                    color: "#E6E6E6",
                    fontSize: "1rem",
                    padding: "14px 18px",
                    paddingRight: "45px",
                    minHeight: "52px",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2AB3EE")}
                  onBlur={(e) => (e.target.style.borderColor = "#E6E6E6")}
                />
                <button
                  type="button"
                  onClick={() => startDateRef.current?.showPicker?.()}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 cursor-pointer p-1 hover:opacity-80 transition-opacity"
                  style={{ background: "transparent", border: "none" }}
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#E6E6E6" 
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label
                className="block mb-2.5 text-base md:text-lg font-semibold"
                style={{ color: "#E6E6E6" }}
              >
                End Date
              </label>
              <div className="relative">
                <input
                  ref={endDateRef}
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="w-full rounded-lg outline-none date-input-white transition-colors"
                  style={{
                    backgroundColor: "#1F2022",
                    border: "2px solid #E6E6E6",
                    color: "#E6E6E6",
                    fontSize: "1rem",
                    padding: "14px 18px",
                    paddingRight: "45px",
                    minHeight: "52px",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2AB3EE")}
                  onBlur={(e) => (e.target.style.borderColor = "#E6E6E6")}
                />
                <button
                  type="button"
                  onClick={() => endDateRef.current?.showPicker?.()}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 cursor-pointer p-1 hover:opacity-80 transition-opacity"
                  style={{ background: "transparent", border: "none" }}
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#E6E6E6" 
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-5 md:px-7 py-3 md:py-3.5 rounded-lg font-semibold text-base md:text-lg flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                backgroundColor: loading ? "#2A2B30" : "#2AB3EE",
                color: "#FFFFFF",
                minHeight: "52px",
                boxShadow: loading
                  ? "none"
                  : "0 4px 12px rgba(42, 179, 238, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#1F8FD0";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#2AB3EE";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? (
                <>
                  <Loader size="sm" color="#FFFFFF" />
                  Generating...
                </>
              ) : (
                <>
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Generate Report
                </>
              )}
            </button>
            {reportData && (
              <>
                <button
                  onClick={handleExportCSV}
                  disabled={exportingCSV || exportingExcel}
                  className="px-5 md:px-7 py-3 md:py-3.5 rounded-lg font-semibold text-base md:text-lg whitespace-nowrap flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    backgroundColor: exportingCSV ? "#2A2B30" : "#009200",
                    color: "#FFFFFF",
                    minHeight: "52px",
                    boxShadow: exportingCSV
                      ? "none"
                      : "0 4px 12px rgba(0, 146, 0, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!exportingCSV && !exportingExcel) {
                      e.currentTarget.style.backgroundColor = "#007700";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!exportingCSV && !exportingExcel) {
                      e.currentTarget.style.backgroundColor = "#009200";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {exportingCSV ? (
                    <>
                      <Loader size="sm" color="#FFFFFF" />
                      Exporting...
                    </>
                  ) : (
                    <>
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Export CSV
                    </>
                  )}
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={exportingCSV || exportingExcel}
                  className="px-5 md:px-7 py-3 md:py-3.5 rounded-lg font-semibold text-base md:text-lg whitespace-nowrap flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    backgroundColor: exportingExcel ? "#2A2B30" : "#009200",
                    color: "#FFFFFF",
                    minHeight: "52px",
                    boxShadow: exportingExcel
                      ? "none"
                      : "0 4px 12px rgba(0, 146, 0, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!exportingCSV && !exportingExcel) {
                      e.currentTarget.style.backgroundColor = "#007700";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!exportingCSV && !exportingExcel) {
                      e.currentTarget.style.backgroundColor = "#009200";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {exportingExcel ? (
                    <>
                      <Loader size="sm" color="#FFFFFF" />
                      Exporting...
                    </>
                  ) : (
                    <>
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Export Excel
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Report Data */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size="lg" color="#2AB3EE" />
          </div>
        ) : reportData ? (
          <div className="space-y-6 md:space-y-8">
            {/* Main Summary Cards - Matching Dashboard Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div
                className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#2AB3EE] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{ transform: "translateZ(0)" }}
              >
                <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">
                  Total Complaints
                </h3>
                <p className="font-bold text-white !text-4xl md:text-9xl leading-none">
                  {reportData.totalComplaints}
                </p>
              </div>

              <div
                className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#009200] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{ transform: "translateZ(0)" }}
              >
                <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">
                  Resolved
                </h3>
                <p className="font-bold text-white !text-4xl md:text-9xl leading-none">
                  {reportData.complaintsByStatus.Closed || 0}
                </p>
              </div>

              <div
                className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#2A2B30] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border border-[#E6E6E6] border-opacity-10"
                style={{ transform: "translateZ(0)" }}
              >
                <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">
                  Avg Response
                </h3>
                <p className="font-bold text-white !text-4xl md:text-9xl leading-none">
                  {reportData.averageResponseTime.toFixed(0)}
                  <span className="text-2xl md:text-4xl">h</span>
                </p>
              </div>

              <div
                className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#2A2B30] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border border-[#E6E6E6] border-opacity-10"
                style={{ transform: "translateZ(0)" }}
              >
                <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">
                  Avg Resolution
                </h3>
                <p className="font-bold text-white !text-4xl md:text-9xl leading-none">
                  {reportData.averageResolutionTime.toFixed(0)}
                  <span className="text-2xl md:text-4xl">h</span>
                </p>
              </div>
            </div>

            {/* Status Breakdown - Enhanced Cards */}
            <div
              className="rounded-lg p-6 md:p-8 lg:p-10"
              style={{
                backgroundColor: "#2A2B30",
                border: "1px solid rgba(230, 230, 230, 0.1)",
              }}
            >
              <h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8"
                style={{ color: "#E6E6E6" }}
              >
                Complaints by Status
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {Object.entries(reportData.complaintsByStatus).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="rounded-lg p-8 md:p-10 lg:p-12 text-center transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: "#1F2022",
                        border: `2px solid ${getStatusColor(status)}`,
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(-4px) scale(1.02)";
                        e.currentTarget.style.boxShadow = `0 8px 16px ${getStatusColor(
                          status
                        )}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      <p
                        className="admin-reports-number font-bold mb-4 leading-none"
                        style={{ color: getStatusColor(status) }}
                      >
                        {count as number}
                      </p>
                      <p
                        className="admin-reports-label font-semibold break-words"
                        style={{ color: "#E6E6E6" }}
                      >
                        {status}
                      </p>
                  </div>
                  )
                )}
              </div>
            </div>

            {/* Category Breakdown - Enhanced Cards */}
            <div
              className="rounded-lg p-6 md:p-8 lg:p-10"
              style={{
                backgroundColor: "#2A2B30",
                border: "1px solid rgba(230, 230, 230, 0.1)",
              }}
            >
              <h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8"
                style={{ color: "#E6E6E6" }}
              >
                Complaints by Category
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Object.entries(reportData.complaintsByCategory).map(
                  ([category, count]) => (
                    <div
                      key={category}
                      className="rounded-lg p-8 md:p-10 lg:p-12 text-center transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: "#1F2022",
                        border: "2px solid #2AB3EE",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(-4px) scale(1.02)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 16px rgba(42, 179, 238, 0.3)";
                        e.currentTarget.style.borderColor = "#1F8FD0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0, 0, 0, 0.1)";
                        e.currentTarget.style.borderColor = "#2AB3EE";
                      }}
                    >
                      <p
                        className="admin-reports-number font-bold mb-4 leading-none"
                        style={{ color: "#2AB3EE" }}
                      >
                        {count as number}
                      </p>
                      <p
                        className="admin-reports-label font-semibold break-words"
                        style={{ color: "#E6E6E6" }}
                      >
                        {category}
                      </p>
                  </div>
                  )
                )}
              </div>
            </div>

            {/* Priority Breakdown - Enhanced Cards */}
            <div
              className="rounded-lg p-6 md:p-8 lg:p-10"
              style={{
                backgroundColor: "#2A2B30",
                border: "1px solid rgba(230, 230, 230, 0.1)",
              }}
            >
              <h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8"
                style={{ color: "#E6E6E6" }}
              >
                Complaints by Priority
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {Object.entries(reportData.complaintsByPriority).map(
                  ([priority, count]) => (
                    <div
                      key={priority}
                      className="rounded-lg p-8 md:p-10 lg:p-12 text-center transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: "#1F2022",
                        border: `2px solid ${getPriorityColor(priority)}`,
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(-4px) scale(1.02)";
                        e.currentTarget.style.boxShadow = `0 8px 16px ${getPriorityColor(
                          priority
                        )}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      <p
                        className="admin-reports-number font-bold mb-4 leading-none"
                        style={{ color: getPriorityColor(priority) }}
                      >
                        {count as number}
                      </p>
                      <p
                        className="admin-reports-label font-semibold"
                        style={{ color: "#E6E6E6" }}
                      >
                        {priority}
                      </p>
                  </div>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 md:py-20">
            <p
              className="text-xl md:text-2xl"
              style={{ color: "#E6E6E6", opacity: 0.7 }}
            >
              Select a date range and click "Generate Report" to view analytics
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
