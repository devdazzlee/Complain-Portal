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

    return {
      id: String(item.id || ''),
      complaintId: `CMP-${item.id || ''}`,
      caretaker: String(item['Complainant'] || item.complainant || ''),
      typeOfProblem: String(type?.name || type?.code || ''),
      description: String(item.description || ''),
      status: String(status?.label || status?.code || 'Open') as ComplaintStatus,
      priority: String(priority?.label || priority?.code || 'Low') as Priority,
      dateSubmitted: latestHistory ? new Date(String(latestHistory.created_at || '')).toLocaleDateString() : new Date().toLocaleDateString(),
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
      timeline: history?.map((h: Record<string, unknown>, index: number) => ({
        id: String(index),
        status: String(h.status?.label || h.status?.code || ''),
        handler: String(h['Case Handle By'] || ''),
        remarks: String(h['Handler Remarks'] || ''),
        date: new Date().toISOString(),
      })) || [],
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
  const itemsPerPage = 10;

  // Fetch complaints from API (only if stale)
  useEffect(() => {
    const fetchComplaints = async () => {
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
  }, [isComplaintsStale, storeComplaints.length, setComplaints]);

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
                  <SelectItem value="Open" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Open</SelectItem>
                  <SelectItem value="In Progress" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">In Progress</SelectItem>
                  <SelectItem value="Closed" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Closed</SelectItem>
                  <SelectItem value="Refused" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Refused</SelectItem>
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
                  <SelectItem value="Late arrival" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Late arrival</SelectItem>
                  <SelectItem value="Behavior" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Behavior</SelectItem>
                  <SelectItem value="Missed service" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Missed service</SelectItem>
                  <SelectItem value="Other" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Other</SelectItem>
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
                  <SelectItem value="Low" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Low</SelectItem>
                  <SelectItem value="Medium" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Medium</SelectItem>
                  <SelectItem value="High" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">High</SelectItem>
                  <SelectItem value="Urgent" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Urgent</SelectItem>
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
                  <SelectItem value="date" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Date</SelectItem>
                  <SelectItem value="status" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Status</SelectItem>
                  <SelectItem value="priority" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Complaints List */}
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
                      <span
                        className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap"
                        style={{ backgroundColor: getStatusColor(complaint.status), color: '#E6E6E6' }}
                      >
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-base md:text-lg mb-2 break-words" style={{ color: '#E6E6E6', opacity: 0.8 }}>
                      {complaint.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 md:gap-4 text-xs md:text-sm" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                  <span>Caretaker: {complaint.caretaker}</span>
                  <span>Type: {complaint.typeOfProblem}</span>
                  <span>Date: {complaint.dateSubmitted}</span>
                  {complaint.category && <span>Category: {complaint.category}</span>}
                  {complaint.assignedTo && <span>Assigned: {complaint.assignedTo}</span>}
                </div>
              </Link>
            ))
          )}
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

