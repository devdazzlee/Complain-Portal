'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { complaintService } from '../../../lib/services';
import { Complaint, ComplaintStatus, Priority, ComplaintCategory, FileAttachment, ComplaintTimelineItem, ProblemType } from '../../types';
import PriorityBadge from '../../components/PriorityBadge';
import { exportToCSV, exportToExcel } from '../../utils/export';
import Loader from '../../components/Loader';
import { useSearchStore } from '../../../lib/stores/searchStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdvancedSearchPage() {
  const router = useRouter();
  const {
    statuses,
    types,
    priorities,
    sortByOptions,
    setStatuses,
    setTypes,
    setPriorities,
    setSortByOptions,
    isMetadataStale,
  } = useSearchStore();

  // Debug: Log store values when they change
  useEffect(() => {
    console.log('=== Store Values Updated ===');
    console.log('Statuses:', statuses);
    console.log('Statuses length:', statuses?.length);
    console.log('Types:', types);
    console.log('Types length:', types?.length);
    console.log('SortByOptions:', sortByOptions);
    console.log('SortByOptions length:', sortByOptions?.length);
  }, [statuses, types, sortByOptions]);

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
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<ProblemType | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [sortBy, setSortBy] = useState<string>('');
  const [results, setResults] = useState<Complaint[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch statuses, types, priorities, and sort options on mount (only if stale)
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!isMetadataStale() && statuses.length > 0 && types.length > 0 && priorities.length > 0 && sortByOptions.length > 0) {
        // Set default sortBy if not set
        if (!sortBy && sortByOptions.length > 0) {
          const firstSortOption = sortByOptions[0] as Record<string, unknown>;
          setSortBy(String(firstSortOption.id || firstSortOption.value || ''));
        }
        return;
      }

      try {
        console.log('Fetching metadata from API...');
        const [statusesResponse, typesResponse, prioritiesResponse, sortByResponse] = await Promise.all([
          complaintService.getStatuses().catch((err) => {
            console.error('Error fetching statuses:', err);
            return { data: [] };
          }),
          complaintService.getTypes().catch((err) => {
            console.error('Error fetching types:', err);
            return { data: [] };
          }),
          complaintService.getPriorities().catch((err) => {
            console.error('Error fetching priorities:', err);
            return { data: [] };
          }),
          complaintService.getSortByOptions().catch((err) => {
            console.error('Error fetching sortByOptions:', err);
            return { data: [] };
          }),
        ]);

        console.log('Statuses response:', statusesResponse);
        console.log('Types response:', typesResponse);
        console.log('SortBy response:', sortByResponse);

        // Parse statuses - API returns { status: true, statuses: [...] }
        const apiStatuses = (typeof statusesResponse === 'object' && statusesResponse !== null && !Array.isArray(statusesResponse))
          ? (statusesResponse as any).statuses || (statusesResponse as any).payload || (statusesResponse as any).data
          : Array.isArray(statusesResponse) ? statusesResponse : [];
        console.log('Parsed statuses:', apiStatuses);
        setStatuses(Array.isArray(apiStatuses) ? apiStatuses : []);

        // Parse types - API returns { status: true, types: [...] }
        const apiTypes = (typeof typesResponse === 'object' && typesResponse !== null && !Array.isArray(typesResponse))
          ? (typesResponse as any).types || (typesResponse as any).payload || (typesResponse as any).data
          : Array.isArray(typesResponse) ? typesResponse : [];
        console.log('Parsed types:', apiTypes);
        setTypes(Array.isArray(apiTypes) ? apiTypes : []);

        // Parse priorities
        const apiPriorities = (typeof prioritiesResponse === 'object' && prioritiesResponse !== null && !Array.isArray(prioritiesResponse))
          ? (prioritiesResponse as any).priorities || (prioritiesResponse as any).payload || (prioritiesResponse as any).data
          : Array.isArray(prioritiesResponse) ? prioritiesResponse : [];
        setPriorities(Array.isArray(apiPriorities) ? apiPriorities : []);

        // Parse sort by options
        const apiSortBy = (typeof sortByResponse === 'object' && sortByResponse !== null && !Array.isArray(sortByResponse))
          ? (sortByResponse as any).sort_by || (sortByResponse as any).sortByOptions || (sortByResponse as any).payload || (sortByResponse as any).data
          : Array.isArray(sortByResponse) ? sortByResponse : [];
        console.log('Parsed sortBy:', apiSortBy);
        const sortByList = Array.isArray(apiSortBy) ? apiSortBy : [];
        setSortByOptions(sortByList);
        
        // Set default sortBy if not set
        if (!sortBy && sortByList.length > 0) {
          const firstSortOption = sortByList[0] as Record<string, unknown>;
          setSortBy(String(firstSortOption.id || firstSortOption.value || ''));
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };

    fetchMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMetadataStale, statuses.length, types.length, priorities.length, sortByOptions.length, setStatuses, setTypes, setPriorities, setSortByOptions]);

  // Map status label to ID from API
  const getStatusId = (statusLabel: ComplaintStatus | 'All'): number | undefined => {
    if (statusLabel === 'All') return undefined;
    const status = statuses.find((s: any) => 
      s.label?.toLowerCase() === statusLabel.toLowerCase() || 
      s.code?.toLowerCase() === statusLabel.toLowerCase() ||
      s.name?.toLowerCase() === statusLabel.toLowerCase()
    );
    return status?.id as number | undefined;
  };

  // Map status from API to UI format
  const mapStatus = (statusName: string): ComplaintStatus => {
    const statusStr = statusName?.toLowerCase() || '';
    if (statusStr.includes('open')) return 'Open';
    if (statusStr.includes('progress') || statusStr.includes('pending')) return 'In Progress';
    if (statusStr.includes('closed') || statusStr.includes('resolved')) return 'Closed';
    if (statusStr.includes('refused') || statusStr.includes('rejected')) return 'Refused';
    if (statusStr.includes('hold')) return 'In Progress';
    return 'Open';
  };

  // Deduplicate statuses by mapped status value to prevent multiple selections
  const deduplicatedStatuses = useMemo(() => {
    const seenStatuses = new Set<ComplaintStatus | string>();
    return statuses.filter((status: Record<string, unknown>) => {
      const statusName = (status.label as string) || (status.name as string) || (status.code as string) || '';
      const mappedStatus = mapStatus(statusName);
      
      if (seenStatuses.has(mappedStatus)) {
        return false;
      }
      seenStatuses.add(mappedStatus);
      return true;
    });
  }, [statuses]);

  // Map priority label to ID
  const getPriorityId = (priorityLabel: Priority | 'All'): number | undefined => {
    if (priorityLabel === 'All') return undefined;
    const priority = priorities.find((p: any) => {
      const pLabel = (p.label as string)?.toLowerCase() || '';
      const pName = (p.name as string)?.toLowerCase() || '';
      const pCode = (p.code as string)?.toLowerCase() || '';
      const searchLabel = priorityLabel.toLowerCase();
      return pLabel === searchLabel || pName === searchLabel || pCode === searchLabel;
    });
    return priority?.id as number | undefined;
  };

  // Map type/category label to ID
  const getTypeId = (categoryLabel: ProblemType | ComplaintCategory | 'All'): number | undefined => {
    if (categoryLabel === 'All') return undefined;
    // Handle "Late arrival" vs "Late Arrival" mapping
    const normalizedLabel = categoryLabel === 'Late arrival' ? 'Late Arrival' : categoryLabel;
    const type = types.find((t: any) => {
      const tName = (t.name as string)?.toLowerCase() || '';
      const tCode = (t.code as string)?.toLowerCase() || '';
      const searchLabel = normalizedLabel.toLowerCase();
      return tName === searchLabel || tCode === searchLabel || 
             (normalizedLabel === 'Late Arrival' && (tName.includes('late') || tCode.includes('late')));
    });
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
      
      // Helper function to safely format dates
      const formatDate = (dateString: string | undefined | null): string => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch {
          return '';
        }
      };
      
      // Get dates from API - check multiple possible locations
      const createdAt = item.created_at as string || 
                       item.createdAt as string || 
                       (history.length > 0 && history[0].created_at ? String(history[0].created_at) : '') ||
                       '';
      const updatedAt = item.updated_at as string || 
                       item.updatedAt as string || 
                       (history.length > 0 && history[history.length - 1].updated_at ? String(history[history.length - 1].updated_at) : '') ||
                       '';
      
      // Format dates safely - use current date as fallback if no date available
      const dateSubmitted = formatDate(createdAt) || 
                            (history.length > 0 ? formatDate(String(history[0].created_at || history[0].updated_at || '')) : '') ||
                            new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      
      const lastUpdate = formatDate(updatedAt) ||
                        (history.length > 0 ? formatDate(String(history[history.length - 1].updated_at || history[history.length - 1].created_at || '')) : '') ||
                        dateSubmitted;
      
      return {
        id: String(item.id || Date.now()),
        complaintId: `CMP-${item.id}`,
        caretaker: String(item.Complainant || item.caretaker_name || item.client_name || "Unknown"),
        typeOfProblem: (typeName === "Late Arrival" ? "Late arrival" : typeName) as ProblemType,
        description: String(item.description || ""),
        dateSubmitted: dateSubmitted,
        lastUpdate: lastUpdate,
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
      const searchFilters: any = {};
      
      // General search
      if (filters.searchQuery.trim()) {
        searchFilters.general_search = filters.searchQuery.trim();
      }
      
      // Status filter - use dropdown filter first, then button filters
      if (statusFilter !== 'All') {
        const statusId = getStatusId(statusFilter);
        if (statusId) {
          searchFilters.status_id = statusId;
        }
      } else if (filters.status.length > 0) {
        const statusId = getStatusId(filters.status[0]);
        if (statusId) {
          searchFilters.status_id = statusId;
        }
      }
      
      // Priority filter - use dropdown filter first, then button filters
      if (priorityFilter !== 'All') {
        const priorityId = getPriorityId(priorityFilter);
        if (priorityId) {
          searchFilters.priority_id = priorityId;
        }
      } else if (filters.priority.length > 0) {
        const priorityId = getPriorityId(filters.priority[0]);
        if (priorityId) {
          searchFilters.priority_id = priorityId;
        }
      }
      
      // Type filter - use dropdown filter first, then button filters
      if (typeFilter !== 'All') {
        const typeId = getTypeId(typeFilter);
        if (typeId) {
          searchFilters.type_id = typeId;
        }
      } else if (filters.category.length > 0) {
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
      
      // Sort by (use API value directly)
      if (sortBy) {
        const sortByValue = parseInt(sortBy);
        if (!isNaN(sortByValue)) {
          searchFilters.sort_by = sortByValue;
        }
      }
      
      console.log('Search filters being sent:', searchFilters);
      
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
    setExporting(true);
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
    setTimeout(() => setExporting(false), 1000);
  };

  const handleExportExcel = () => {
    if (results.length === 0) return;
    setExporting(true);
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
    setTimeout(() => setExporting(false), 1000);
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
    setStatusFilter('All');
    setTypeFilter('All');
    setPriorityFilter('All');
    setSortBy('');
    setResults([]);
  };
  
  // Auto-search when dropdown filters change (only if we have results or search query)
  useEffect(() => {
    // Only auto-search if we have results already (meaning user has searched before) or has search query
    // This prevents auto-searching on initial load
    const shouldAutoSearch = results.length > 0 || filters.searchQuery.trim().length > 0;
    const hasFilters = statusFilter !== 'All' || typeFilter !== 'All' || priorityFilter !== 'All' || filters.searchQuery.trim() || (filters.dateRange.start && filters.dateRange.end);
    
    if (shouldAutoSearch && hasFilters) {
      // Debounce the search to avoid too many API calls
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, priorityFilter, sortBy]);

  return (
    <Layout role="provider">
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

        {/* Dropdown Filters */}
        <div className="rounded-lg p-4 md:p-6 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Filter by Status</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ComplaintStatus | 'All')}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  <SelectItem value="All" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">All Status</SelectItem>
                  {deduplicatedStatuses.length > 0 ? (
                    deduplicatedStatuses.map((status: any) => {
                      const statusName = status.label || status.name || status.code || '';
                      const statusValue = mapStatus(statusName);
                      return (
                        <SelectItem
                          key={String(status.id || '')}
                          value={statusValue}
                          className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                        >
                          {statusName}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="loading" disabled className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Loading...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Filter by Type</label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ProblemType | 'All')}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  <SelectItem value="All" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">All Types</SelectItem>
                  {types.length > 0 ? (
                    types.map((type: any) => {
                      const typeName = type.name || type.code || '';
                      const typeValue = typeName === 'Late Arrival' ? 'Late arrival' : typeName;
                      return (
                        <SelectItem
                          key={String(type.id || '')}
                          value={typeValue}
                          className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                        >
                          {typeName}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="loading" disabled className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Loading...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Filter by Priority</label>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Priority | 'All')}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  <SelectItem value="All" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">All Priorities</SelectItem>
                  {priorities.map((priority: any) => {
                    const priorityName = priority.label || priority.name || priority.code || '';
                    return (
                      <SelectItem
                        key={String(priority.id || '')}
                        value={priorityName}
                        className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                      >
                        {priorityName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Sort By</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  {sortByOptions.length > 0 ? (
                    sortByOptions.map((option: any) => {
                      const optionId = String(option.id || option.value || '');
                      const optionLabel = String(option.label || option.name || option.value || '');
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
                    <SelectItem value="loading" disabled className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Loading...</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
                {deduplicatedStatuses.map((status: any) => {
                  const statusName = status.label || status.name || status.code || '';
                  const statusValue = mapStatus(statusName);
                  return (
                  <button
                      key={String(status.id || '')}
                      onClick={() => toggleStatus(statusValue)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                        backgroundColor: filters.status.includes(statusValue) ? '#2AB3EE' : '#1F2022',
                      color: '#E6E6E6',
                      border: '2px solid #E6E6E6',
                    }}
                  >
                      {statusName}
                  </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="mb-4">
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Priority</label>
              <div className="flex flex-wrap gap-2">
                {priorities.map((priority: any) => {
                  const priorityName = priority.label || priority.name || priority.code || '';
                  return (
                  <button
                      key={String(priority.id || '')}
                      onClick={() => togglePriority(priorityName as Priority)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                        backgroundColor: filters.priority.includes(priorityName as Priority) ? '#2AB3EE' : '#1F2022',
                      color: '#E6E6E6',
                      border: '2px solid #E6E6E6',
                    }}
                  >
                      {priorityName}
                  </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Category</label>
              <div className="flex flex-wrap gap-2">
                {types.map((type: any) => {
                  const typeName = type.name || type.code || '';
                  const categoryValue = typeName === 'Late Arrival' ? 'Late arrival' : typeName;
                  return (
                  <button
                      key={String(type.id || '')}
                      onClick={() => toggleCategory(categoryValue as ComplaintCategory)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                        backgroundColor: filters.category.includes(categoryValue as ComplaintCategory) ? '#2AB3EE' : '#1F2022',
                      color: '#E6E6E6',
                      border: '2px solid #E6E6E6',
                    }}
                  >
                      {typeName}
                  </button>
                  );
                })}
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
                disabled={exporting}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap"
                style={{ backgroundColor: exporting ? '#2A2B30' : '#009200', color: '#E6E6E6', minHeight: '44px' }}
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap"
                style={{ backgroundColor: exporting ? '#2A2B30' : '#009200', color: '#E6E6E6', minHeight: '44px' }}
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
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
            results.map(complaint => (
              <div
                key={complaint.id}
                className="rounded-lg p-4 md:p-6 cursor-pointer transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: '#2A2B30', border: '2px solid #E6E6E6' }}
                onClick={() => router.push(`/provider/complaints/${complaint.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/provider/complaints/${complaint.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 md:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold mb-2 break-words" style={{ color: '#E6E6E6' }}>
                      {complaint.complaintId}
                    </h3>
                    <p className="text-base md:text-lg mb-2 break-words" style={{ color: '#E6E6E6', opacity: 0.8 }}>
                      {complaint.description}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <PriorityBadge priority={complaint.priority} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 md:gap-4 text-xs md:text-sm" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                  <span>Client: {complaint.caretaker}</span>
                  <span>Status: {complaint.status}</span>
                  <span>Date: {complaint.dateSubmitted}</span>
                  {complaint.category && <span>Category: {complaint.category}</span>}
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>
    </Layout>
  );
}

