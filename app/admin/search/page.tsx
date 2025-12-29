'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { complaintService } from '../../../lib/services';
import { Complaint, ComplaintStatus, Priority, ComplaintCategory, FileAttachment, ComplaintTimelineItem, ProblemType } from '../../types';
import PriorityBadge from '../../components/PriorityBadge';
import { exportToCSV, exportToExcel } from '../../utils/export';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Loader';

export default function AdvancedSearchPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: [] as ComplaintStatus[],
    priority: [] as Priority[],
    category: [] as ComplaintCategory[],
    assignedTo: '',
    dateRange: {
      start: '',
      end: '',
    },
    tags: [] as string[],
  });
  const [results, setResults] = useState<Complaint[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [, setStatuses] = useState<Array<Record<string, unknown>>>([]);
  const [types, setTypes] = useState<Array<Record<string, unknown>>>([]);
  const [priorities, setPriorities] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch statuses, types, and priorities on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [statusesResponse, typesResponse, prioritiesResponse] = await Promise.all([
          complaintService.getStatuses().catch(() => ({ data: [] })),
          complaintService.getTypes().catch(() => ({ data: [] })),
          complaintService.getPriorities().catch(() => ({ data: [] })),
        ]);

        const apiStatuses = statusesResponse?.payload || statusesResponse?.data || statusesResponse;
        setStatuses(Array.isArray(apiStatuses) ? apiStatuses : []);

        const apiTypes = typesResponse?.payload || typesResponse?.data || typesResponse;
        setTypes(Array.isArray(apiTypes) ? apiTypes : []);

        const apiPriorities = prioritiesResponse?.payload || prioritiesResponse?.data || prioritiesResponse;
        setPriorities(Array.isArray(apiPriorities) ? apiPriorities : []);
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };

    fetchMetadata();
  }, []);

  // Map status label to ID
  const getStatusId = (statusLabel: ComplaintStatus): number | undefined => {
    const statusMap: Record<string, number> = {
      'Open': 1,
      'In Progress': 2,
      'On Hold': 3,
      'Refused': 4,
      'Closed': 5,
    };
    return statusMap[statusLabel];
  };

  // Map priority label to ID
  const getPriorityId = (priorityLabel: Priority): number | undefined => {
    const priority = priorities.find((p: Record<string, unknown>) => 
      (p.label as string)?.toLowerCase() === priorityLabel.toLowerCase() || 
      (p.code as string)?.toLowerCase() === priorityLabel.toLowerCase()
    );
    return priority?.id as number | undefined;
  };

  // Map type/category label to ID
  const getTypeId = (categoryLabel: ComplaintCategory): number | undefined => {
    const type = types.find((t: Record<string, unknown>) => 
      (t.name as string)?.toLowerCase() === categoryLabel.toLowerCase() || 
      (t.code as string)?.toLowerCase() === categoryLabel.toLowerCase()
    );
    return type?.id as number | undefined;
  };

  // Map API response to Complaint format
  const mapComplaintsFromResponse = (response: Record<string, unknown>): Complaint[] => {
    const apiComplaints = response?.complaints || response?.payload || response?.data || response;
    const complaintsList = Array.isArray(apiComplaints) ? apiComplaints : [];
    
    return complaintsList.map((item: Record<string, unknown>) => {
      const history = (item.history as Array<Record<string, unknown>>) || [];
      const latestStatus = history.length > 0 
        ? (history[history.length - 1].status as Record<string, unknown>)
        : null;
      const statusLabel = latestStatus?.label as string || "Open";
      
      const typeObj = item.type as Record<string, unknown> || {};
      const typeName = (typeObj.name as string) || (typeObj.code as string) || "Other";
      
      const priorityObj = item.priority as Record<string, unknown> || {};
      const priorityLabel = (priorityObj.label as string) || "Medium";
      
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
      
      const mapStatus = (status: string): ComplaintStatus => {
        const statusStr = status?.toLowerCase() || '';
        if (statusStr.includes('open')) return 'Open';
        if (statusStr.includes('progress') || statusStr.includes('pending')) return 'In Progress';
        if (statusStr.includes('closed') || statusStr.includes('resolved')) return 'Closed';
        if (statusStr.includes('refused') || statusStr.includes('rejected')) return 'Refused';
        return 'Open';
      };
      
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

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build API search filters
      const searchFilters: {
        general_search?: string;
        status_id?: number;
        priority_id?: number;
        type_id?: number;
        starting_date?: string;
        end_date?: string;
        sort_by?: number;
      } = {};
      
      // General search
      if (filters.searchQuery.trim()) {
        searchFilters.general_search = filters.searchQuery.trim();
      }
      
      // Status filter (take first selected status)
      if (filters.status.length > 0) {
        const statusId = getStatusId(filters.status[0]);
        if (statusId) {
          searchFilters.status_id = statusId;
        }
      }
      
      // Priority filter (take first selected priority)
      if (filters.priority.length > 0) {
        const priorityId = getPriorityId(filters.priority[0]);
        if (priorityId) {
          searchFilters.priority_id = priorityId;
        }
      }
      
      // Type filter (take first selected category)
      if (filters.category.length > 0) {
        const typeId = getTypeId(filters.category[0]);
        if (typeId) {
          searchFilters.type_id = typeId;
        }
      }
      
      // Date range
      if (filters.dateRange.start && filters.dateRange.end) {
        searchFilters.starting_date = `${filters.dateRange.start} 00:00:00`;
        searchFilters.end_date = `${filters.dateRange.end} 23:59:59`;
      }
      
      // Sort by (default to newest first)
      searchFilters.sort_by = 1;
      
      // Call API
      const response = await complaintService.search(searchFilters);
      const mappedComplaints = mapComplaintsFromResponse(response);
      setResults(mappedComplaints);
    } catch (err: unknown) {
      console.error('Error searching complaints:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (err as { message?: string })?.message || 
                          'Failed to search complaints';
      setError(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    setExportingCSV(true);
    const exportData = results.map((c) => ({
      "Complaint ID": c.complaintId,
      "Date Submitted": c.dateSubmitted,
      "Complainant": c.caretaker,
      "Type": c.typeOfProblem,
      "Priority": c.priority,
      "Status": c.status,
      "Description": c.description,
    }));
    exportToCSV(exportData, 'complaints_search_results');
    setTimeout(() => setExportingCSV(false), 1000);
  };

  const handleExportExcel = () => {
    if (results.length === 0) return;
    setExportingExcel(true);
    const exportData = results.map((c) => ({
      "Complaint ID": c.complaintId,
      "Date Submitted": c.dateSubmitted,
      "Complainant": c.caretaker,
      "Type": c.typeOfProblem,
      "Priority": c.priority,
      "Status": c.status,
      "Description": c.description,
    }));
    exportToExcel(exportData, 'complaints_search_results');
    setTimeout(() => setExportingExcel(false), 1000);
  };

  const toggleStatus = (status: ComplaintStatus) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  };

  const togglePriority = (priority: Priority) => {
    setFilters(prev => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...prev.priority, priority],
    }));
  };

  const toggleCategory = (category: ComplaintCategory) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category],
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      status: [],
      priority: [],
      category: [],
      assignedTo: '',
      dateRange: { start: '', end: '' },
      tags: [],
    });
    setResults([]);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = results.slice(startIndex, endIndex);

  // Reset to page 1 when results change
  useEffect(() => {
    setCurrentPage(1);
  }, [results.length]);

  return (
    <Layout role="admin">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6" style={{ color: '#E6E6E6' }}>
          Advanced Search
        </h1>

        {/* Search Bar */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by complaint ID, caretaker, description..."
              className="flex-1 rounded-lg outline-none transition"
              style={{
                backgroundColor: '#1F2022',
                border: '2px solid #E6E6E6',
                color: '#E6E6E6',
                fontSize: '1rem',
                padding: '14px 18px',
                minHeight: '52px',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
              onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="flex gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={handleSearch}
                className="flex-1 sm:flex-none px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg whitespace-nowrap"
                style={{ backgroundColor: '#2AB3EE', color: '#E6E6E6', minHeight: '52px' }}
              >
                Search
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-none px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg whitespace-nowrap"
                style={{ backgroundColor: '#2A2B30', color: '#E6E6E6', border: '2px solid #E6E6E6', minHeight: '52px' }}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="rounded-lg p-4 md:p-6 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
            <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Filters</h2>
            
            {/* Status Filter */}
            <div className="mb-4">
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Status</label>
              <div className="flex flex-wrap gap-2">
                {(['Open', 'In Progress', 'Closed', 'Refused'] as ComplaintStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                      backgroundColor: filters.status.includes(status) ? '#2AB3EE' : '#1F2022',
                      color: '#E6E6E6',
                      border: '2px solid #E6E6E6',
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="mb-4">
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Priority</label>
              <div className="flex flex-wrap gap-2">
                {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map(priority => (
                  <button
                    key={priority}
                    onClick={() => togglePriority(priority)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                      backgroundColor: filters.priority.includes(priority) ? '#2AB3EE' : '#1F2022',
                      color: '#E6E6E6',
                      border: '2px solid #E6E6E6',
                    }}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Category</label>
              <div className="flex flex-wrap gap-2">
                {(['Service Quality', 'Staff Behavior', 'Timing Issues', 'Safety Concerns', 'Billing', 'Other'] as ComplaintCategory[]).map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                      backgroundColor: filters.category.includes(category) ? '#2AB3EE' : '#1F2022',
                      color: '#E6E6E6',
                      border: '2px solid #E6E6E6',
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Start Date</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })}
                  className="w-full rounded-lg outline-none"
                  style={{
                    backgroundColor: '#1F2022',
                    border: '2px solid #E6E6E6',
                    color: '#E6E6E6',
                    fontSize: '1rem',
                    padding: '14px 18px',
                    minHeight: '52px',
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>End Date</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } })}
                  className="w-full rounded-lg outline-none"
                  style={{
                    backgroundColor: '#1F2022',
                    border: '2px solid #E6E6E6',
                    color: '#E6E6E6',
                    fontSize: '1rem',
                    padding: '14px 18px',
                    minHeight: '52px',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg"
                style={{ backgroundColor: '#2A2B30', color: '#E6E6E6', border: '2px solid #E6E6E6', minHeight: '52px' }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="rounded-lg p-4 mb-6"
            style={{
              backgroundColor: "#FF3F3F",
              color: "#FFFFFF",
            }}
          >
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-base md:text-lg" style={{ color: '#E6E6E6' }}>
              Found {results.length} complaint(s)
            </p>
            <div className="flex gap-2 md:gap-4">
              <button
                onClick={handleExportCSV}
                disabled={exportingCSV || exportingExcel}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap"
                style={{ backgroundColor: exportingCSV ? '#2A2B30' : '#009200', color: '#E6E6E6', minHeight: '44px' }}
              >
                {exportingCSV ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exportingCSV || exportingExcel}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap"
                style={{ backgroundColor: exportingExcel ? '#2A2B30' : '#009200', color: '#E6E6E6', minHeight: '44px' }}
              >
                {exportingExcel ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>
        )}

        {/* Results List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size="lg" color="#2AB3EE" />
          </div>
        ) : (
        <div className="space-y-4">
            {results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                {filters.searchQuery || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : (typeof v === 'object' && v !== null && Object.values(v).some(x => x))) 
                  ? 'No complaints found matching your criteria'
                    : 'Enter search criteria and click "Search" to find complaints.'}
              </p>
            </div>
          ) : (
            paginatedResults.map(complaint => (
              <div
                key={complaint.id}
                className="rounded-lg p-4 md:p-6 cursor-pointer transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: '#2A2B30', border: '2px solid #E6E6E6' }}
                onClick={() => router.push(`/admin/complaints/${complaint.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/admin/complaints/${complaint.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 md:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold mb-2 wrap-break-word" style={{ color: '#E6E6E6' }}>
                      {complaint.complaintId}
                    </h3>
                    <p className="text-base md:text-lg mb-2 wrap-break-word" style={{ color: '#E6E6E6', opacity: 0.8 }}>
                      {complaint.description}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <PriorityBadge priority={complaint.priority} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 md:gap-4 text-xs md:text-sm" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                  <span>Caretaker: {complaint.caretaker}</span>
                  <span>Status: {complaint.status}</span>
                  <span>Date: {complaint.dateSubmitted}</span>
                  {complaint.category && <span>Category: {complaint.category}</span>}
                </div>
              </div>
            ))
          )}
        </div>
        )}

        {/* Pagination */}
        {results.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={results.length}
          />
        )}
      </div>
    </Layout>
  );
}

