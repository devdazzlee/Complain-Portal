'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useDashboardStore } from '../../../lib/stores/dashboardStore';
import { complaintService } from '../../../lib/services';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComplaintStatus, ProblemType, Priority, Complaint } from '../../types';
import PriorityBadge from '../../components/PriorityBadge';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Loader';
import { useComplaintStatuses, useComplaintTypes, useComplaintPriorities, useSortByOptions } from '../../../lib/hooks';

// Helper function to map complaints from API response
const mapComplaintsFromResponse = (response: Record<string, unknown>): Complaint[] => {
  const apiComplaints = response?.complaints || response?.payload || response?.data || response;
  const complaintsList = Array.isArray(apiComplaints) ? apiComplaints : [];
  
  return complaintsList.map((item: Record<string, unknown>) => {
    const history = (item.history as Array<Record<string, unknown>>) || [];
    const latestHistory = history.length > 0 ? history[history.length - 1] : null;
    const status = latestHistory?.status as Record<string, unknown> | undefined;
    const type = item.type as Record<string, unknown> | undefined;
    const priority = item.priority as Record<string, unknown> | undefined;
    const files = item.files as Array<Record<string, unknown>> | undefined;

    // Map type to ProblemType
    const typeName = String(type?.name || type?.code || '');
    const mappedType: ProblemType = 
      typeName === 'Late Arrival' || typeName.toLowerCase().includes('late') ? 'Late arrival' :
      typeName === 'Behavior' || typeName.toLowerCase().includes('behavior') ? 'Behavior' :
      typeName === 'Missed service' || typeName.toLowerCase().includes('missed') ? 'Missed service' :
      'Other';
    
    // Map status to ComplaintStatus
    const statusStr = String(status?.label || status?.code || 'Open').toLowerCase();
    const mappedStatus: ComplaintStatus = 
      statusStr.includes('open') ? 'Open' :
      statusStr.includes('progress') || statusStr.includes('pending') ? 'In Progress' :
      statusStr.includes('closed') || statusStr.includes('resolved') ? 'Closed' :
      statusStr.includes('refused') || statusStr.includes('rejected') ? 'Refused' :
      'Open';
    
    return {
      id: String(item.id || ''),
      complaintId: `CMP-${item.id || ''}`,
      caretaker: String(item['Complainant'] || item.complainant || ''),
      typeOfProblem: mappedType,
      description: String(item.description || ''),
      status: mappedStatus,
      priority: String(priority?.label || priority?.code || 'Low') as Priority,
      dateSubmitted: (() => {
        // Helper to safely format dates
        const formatDate = (dateString: string | undefined | null): string => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          } catch {
            return '';
          }
        };
        
        // Try to get date from item first, then history
        const createdAt = item.created_at as string || item.createdAt as string || '';
        if (createdAt) {
          const formatted = formatDate(createdAt);
          if (formatted) return formatted;
        }
        
        // Try first history entry
        if (history.length > 0 && history[0].created_at) {
          const formatted = formatDate(String(history[0].created_at));
          if (formatted) return formatted;
        }
        
        // Fallback to current date
        return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      })(),
      lastUpdate: (() => {
        // Helper to safely format dates
        const formatDate = (dateString: string | undefined | null): string => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          } catch {
            return '';
          }
        };
        
        // Try to get update date from latest history or item
        if (latestHistory?.updated_at) {
          const formatted = formatDate(String(latestHistory.updated_at));
          if (formatted) return formatted;
        }
        
        const updatedAt = item.updated_at as string || item.updatedAt as string || '';
        if (updatedAt) {
          const formatted = formatDate(updatedAt);
          if (formatted) return formatted;
        }
        
        // Fallback to dateSubmitted
        const createdAt = item.created_at as string || item.createdAt as string || '';
        if (createdAt) {
          const formatted = formatDate(createdAt);
          if (formatted) return formatted;
        }
        
        return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      })(),
      assignedTo: String(latestHistory?.['Case Handle By'] || ''),
      attachments: files?.map((f: Record<string, unknown>) => ({
        id: String(f.id || ''),
        name: String(f.file_name || f.path || ''),
        url: String(f.url || ''),
        type: String(f.type || ''),
        size: 0,
        uploadedBy: '',
        uploadedAt: new Date().toISOString(),
      })) || [],
      timeline: history?.map((h: Record<string, unknown>, index: number) => {
        const statusObj = h.status as Record<string, unknown> | undefined;
        const statusCode = String(statusObj?.code || '').toLowerCase();
        return {
          date: String(h.created_at || h.createdAt || h.date || new Date().toISOString()),
          status: String(statusObj?.label || statusObj?.code || ''),
          description: String(h['Handler Remarks'] || h.remarks || ''),
          isCompleted: statusCode === 'closed',
          isRefused: statusCode === 'refused',
          userName: String(h['Case Handle By'] || h.handler || ''),
        };
      }) || [],
    };
  });
};

export default function ComplaintsListPage() {
  const { complaints: storeComplaints, setComplaints, isComplaintsStale } = useDashboardStore();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<ProblemType | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'priority'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const itemsPerPage = 10;

  // Fetch dropdown options from API
  const { data: statusesData } = useComplaintStatuses();
  const { data: typesData } = useComplaintTypes();
  const { data: prioritiesData } = useComplaintPriorities();
  const { data: sortByData } = useSortByOptions();

  // Parse API responses
  // Statuses: hook already parses to array, but check for nested structure
  const statuses = Array.isArray(statusesData) ? statusesData : 
    ((statusesData as any)?.statuses || (statusesData as any)?.data || []);
  // Types: service already returns array
  const types = Array.isArray(typesData) ? typesData : 
    ((typesData as any)?.types || (typesData as any)?.data || []);
  // Priorities: service already returns array
  const priorities = Array.isArray(prioritiesData) ? prioritiesData : 
    ((prioritiesData as any)?.priorities || (prioritiesData as any)?.data || []);
  // Sort By: check for nested structure
  const sortByOptions = Array.isArray(sortByData) ? sortByData : 
    ((sortByData as any)?.sort_by || (sortByData as any)?.sortByOptions || (sortByData as any)?.data || []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch complaints from API (only if stale or search query changed)
  useEffect(() => {
    const fetchComplaints = async () => {
      // If searching, always fetch from API
      if (debouncedSearchQuery.trim()) {
        try {
          setLoading(true);
          const response = await complaintService.getAll(debouncedSearchQuery.trim());
          const mappedComplaints = mapComplaintsFromResponse(response);
          setComplaints(mappedComplaints);
        } catch (error) {
          console.error('Error fetching complaints:', error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // If not searching and cache is fresh, use cache
      if (!isComplaintsStale() && storeComplaints.length > 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await complaintService.getAll();
        const mappedComplaints = mapComplaintsFromResponse(response);
        setComplaints(mappedComplaints);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [isComplaintsStale, storeComplaints.length, setComplaints, debouncedSearchQuery]);

  const filteredAndSortedComplaints = useMemo(() => {
    let filtered = [...storeComplaints];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter(c => c.typeOfProblem === typeFilter);
    }

    if (priorityFilter !== 'All') {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
      } else if (sortBy === 'status') {
        const statusOrder: Record<ComplaintStatus, number> = {
          'Open': 1,
          'In Progress': 2,
          'Closed': 3,
          'Refused': 4,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      } else {
        const priorityOrder: Record<Priority, number> = {
          'Low': 1,
          'Medium': 2,
          'High': 3,
          'Urgent': 4,
        };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
    });

    return filtered;
  }, [storeComplaints, statusFilter, typeFilter, priorityFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedComplaints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComplaints = filteredAndSortedComplaints.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, priorityFilter, sortBy]);

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'Open': return '#2AB3EE';
      case 'In Progress': return '#2AB3EE';
      case 'Closed': return '#009200';
      case 'Refused': return '#FF3F3F';
      default: return '#E6E6E6';
    }
  };

  return (
    <Layout role="provider">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: '#E6E6E6' }}>
            My Complaints
          </h1>
          <Link
            href="/provider/complaints/new"
            className="w-full sm:w-auto px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg text-center whitespace-nowrap transition-colors"
            style={{ 
              backgroundColor: '#FF8800', 
              color: '#E6E6E6', 
              minHeight: '52px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E67700'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8800'}
          >
            + New Complaint
          </Link>
        </div>

        {/* Search Input */}
        <div className="mb-4 md:mb-6">
          <input
            type="text"
            placeholder="Search complaints by title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full px-4 py-3 rounded-lg text-base md:text-lg"
            style={{ 
              backgroundColor: '#1F2022', 
              border: '2px solid #E6E6E6', 
              color: '#E6E6E6',
              minHeight: '52px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
            onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
          />
        </div>

        {/* Filters */}
        <div className="rounded-lg p-4 md:p-6 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Status</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ComplaintStatus | 'All')}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  <SelectItem value="All" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">All Status</SelectItem>
                  {Array.isArray(statuses) && statuses.map((status: Record<string, unknown>) => {
                    const statusLabel = String(status.label || status.name || status.code || '');
                    const statusCode = String(status.code || '').toLowerCase();
                    // Map API status to ComplaintStatus
                    const mappedStatus: ComplaintStatus = 
                      statusCode.includes('open') ? 'Open' :
                      statusCode.includes('progress') || statusCode.includes('pending') ? 'In Progress' :
                      statusCode.includes('closed') || statusCode.includes('resolved') ? 'Closed' :
                      statusCode.includes('refused') || statusCode.includes('rejected') ? 'Refused' :
                      'Open';
                    return (
                      <SelectItem key={String(status.id || statusCode)} value={mappedStatus} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                        {statusLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Type</label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ProblemType | 'All')}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  <SelectItem value="All" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">All Types</SelectItem>
                  {Array.isArray(types) && types.map((type: Record<string, unknown>) => {
                    const typeName = String(type.name || type.code || '');
                    // Map API type to ProblemType
                    const mappedType: ProblemType = 
                      typeName.toLowerCase().includes('late') ? 'Late arrival' :
                      typeName.toLowerCase().includes('behavior') ? 'Behavior' :
                      typeName.toLowerCase().includes('missed') ? 'Missed service' :
                      'Other';
                    return (
                      <SelectItem key={String(type.id || type.code)} value={mappedType} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                        {typeName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Priority</label>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Priority | 'All')}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  <SelectItem value="All" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">All Priorities</SelectItem>
                  {Array.isArray(priorities) && priorities.map((priority: Record<string, unknown>) => {
                    const priorityLabel = String(priority.label || priority.name || priority.code || '');
                    return (
                      <SelectItem key={String(priority.id || priority.code)} value={priorityLabel as Priority} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                        {priorityLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Sort By</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'status' | 'priority')}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  {Array.isArray(sortByOptions) && sortByOptions.length > 0 ? (
                    sortByOptions.map((option: Record<string, unknown>) => {
                      const optionLabel = String(option.label || option.name || option.value || '');
                      const optionValue = String(option.value || option.code || option.id || '');
                      // Map API sort option to our internal values
                      const mappedValue = optionValue.toLowerCase().includes('date') ? 'date' :
                        optionValue.toLowerCase().includes('status') ? 'status' :
                        optionValue.toLowerCase().includes('priority') ? 'priority' : 'date';
                      return (
                        <SelectItem key={String(option.id || optionValue)} value={mappedValue} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                          {optionLabel}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <>
                      <SelectItem value="date" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Date</SelectItem>
                      <SelectItem value="status" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Status</SelectItem>
                      <SelectItem value="priority" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Priority</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader size="lg" />
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredAndSortedComplaints.length === 0 ? (
              <div className="text-center py-12 md:py-16 rounded-lg" style={{ backgroundColor: '#2A2B30' }}>
                <p className="text-lg md:text-xl" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                  No complaints found
                </p>
              </div>
            ) : (
              paginatedComplaints.map(complaint => (
              <Link
                key={complaint.id}
                href={`/provider/complaints/${complaint.id}`}
                className="block rounded-lg p-4 md:p-6 transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: '#2A2B30', border: '2px solid #E6E6E6' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 md:mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2">
                      <h3 className="text-lg md:text-xl font-bold break-words" style={{ color: '#E6E6E6' }}>
                        {complaint.complaintId}
                      </h3>
                      <div className="shrink-0">
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                      {complaint.status && (
                        <span
                          className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap"
                          style={{ backgroundColor: getStatusColor(complaint.status), color: '#E6E6E6' }}
                        >
                          {complaint.status}
                        </span>
                      )}
                    </div>
                    <p className="text-base md:text-lg mb-2 break-words" style={{ color: '#E6E6E6', opacity: 0.8 }}>
                      {complaint.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 md:gap-4 text-xs md:text-sm" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                  <span>Client: {complaint.caretaker}</span>
                  <span>Type: {complaint.typeOfProblem}</span>
                  <span>Date: {complaint.dateSubmitted}</span>
                  {complaint.category && <span>Category: {complaint.category}</span>}
                  {complaint.assignedTo && <span>Assigned: {complaint.assignedTo}</span>}
                </div>
              </Link>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredAndSortedComplaints.length > 0 && (
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

