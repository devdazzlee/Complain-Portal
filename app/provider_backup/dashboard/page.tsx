'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComplaintStatus, ProblemType } from '../../types';

type CardType = 'open' | 'pending' | 'resolved' | 'refused';

export default function CustomerDashboard() {
  const { complaints, getDashboardStats, currentUser } = useApp();
  const router = useRouter();
  const stats = getDashboardStats();
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<ProblemType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  const filteredAndSortedComplaints = useMemo(() => {
    let filtered = [...complaints];

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter(c => c.typeOfProblem === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
      } else {
        const statusOrder: Record<ComplaintStatus, number> = {
          'Open': 1,
          'In Progress': 2,
          'Closed': 3,
          'Refused': 4,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      }
    });

    return filtered;
  }, [complaints, statusFilter, typeFilter, sortBy]);

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-500 text-white';
      case 'Open':
        return 'text-blue-400';
      case 'Closed':
        return 'text-gray-400';
      case 'Refused':
        return 'bg-red-500 text-white';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    if (status === 'In Progress') {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2AB3EE' }}></span>
          <span className="px-3 py-1.5 text-white rounded-full font-semibold" style={{ backgroundColor: '#2AB3EE', fontSize: '1rem' }}>In Progress</span>
        </span>
      );
    }
    if (status === 'Refused') {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF3F3F' }}></span>
          <span className="px-3 py-1.5 text-white rounded-full font-semibold" style={{ backgroundColor: '#FF3F3F', fontSize: '1rem' }}>Refused</span>
        </span>
      );
    }
    if (status === 'Closed') {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#009200' }}></span>
          <span style={{ color: '#009200', fontSize: '1.125rem', fontWeight: 600 }}>{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2AB3EE' }}></span>
        <span style={{ color: '#2AB3EE', fontSize: '1.125rem', fontWeight: 600 }}>{status}</span>
      </span>
    );
  };

  const handleCardClick = (cardType: CardType) => {
    router.push(`/customer/dashboard/${cardType}`);
  };

  return (
    <Layout role="customer">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: '#E6E6E6' }}>How can we help you?</h1>
            <p style={{ color: '#E6E6E6', opacity: 0.8, fontSize: '1.25rem', lineHeight: '1.7' }}>
              You can review your complaints, check follow-up status, or submit a new concern.
            </p>
          </div>
          <Link
            href="/customer/complaints/new"
            className="text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 w-full md:w-auto"
            style={{ 
              backgroundColor: '#FF8800',
              fontSize: '1.25rem',
              padding: '18px 32px',
              minHeight: '60px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E67700'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8800'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Complaint
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
        <div 
          onClick={() => handleCardClick('open')}
          className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#2AB3EE] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ transform: 'translateZ(0)' }}
        >
          <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">Open Complaint</h3>
          <p className="font-bold text-white !text-4xl md:text-9xl leading-none">{stats.openComplaints}</p>
        </div>
        <div 
          onClick={() => handleCardClick('pending')}
          className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#2AB3EE] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ transform: 'translateZ(0)' }}
        >
          <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">Pending Follow-ups</h3>
          <p className="font-bold text-white !text-4xl md:text-9xl leading-none">{stats.pendingFollowups}</p>
        </div>
        <div 
          onClick={() => handleCardClick('resolved')}
          className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#009200] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ transform: 'translateZ(0)' }}
        >
          <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">Resolved This Month</h3>
          <p className="font-bold text-white !text-4xl md:text-9xl leading-none">{stats.resolvedThisMonth}</p>
        </div>
        <div 
          onClick={() => handleCardClick('refused')}
          className="rounded-lg p-6 md:p-8 flex flex-col justify-center items-center bg-[#FF3F3F] min-h-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ transform: 'translateZ(0)' }}
        >
          <h3 className="font-semibold text-[#E6E6E6] text-lg mb-4 text-center">Refused Complaints</h3>
          <p className="font-bold text-white !text-4xl md:text-9xl leading-none">{stats.refusedComplaints}</p>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="rounded-lg p-6 md:p-8" style={{ backgroundColor: '#2A2B30' }}>
        <div className="mb-6">
          <h2 className="text-3xl font-bold" style={{ color: '#E6E6E6' }}>My Complaints</h2>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block mb-2" style={{ color: '#E6E6E6', fontSize: '1rem', fontWeight: 500 }}>Filter by Status</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ComplaintStatus | 'All')}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-4 py-3 min-h-[52px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                <SelectItem value="All" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">All Statuses</SelectItem>
                <SelectItem value="Open" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Open</SelectItem>
                <SelectItem value="In Progress" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">In Progress</SelectItem>
                <SelectItem value="Closed" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Closed</SelectItem>
                <SelectItem value="Refused" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Refused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block mb-2" style={{ color: '#E6E6E6', fontSize: '1rem', fontWeight: 500 }}>Filter by Type</label>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ProblemType | 'All')}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-4 py-3 min-h-[52px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
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
          <div className="flex-1">
            <label className="block mb-2" style={{ color: '#E6E6E6', fontSize: '1rem', fontWeight: 500 }}>Sort By</label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'status')}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-4 py-3 min-h-[52px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                <SelectItem value="date" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Date (Newest First)</SelectItem>
                <SelectItem value="status" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredAndSortedComplaints.length === 0 ? (
            <div className="text-center py-12 rounded-lg" style={{ backgroundColor: '#1F2022' }}>
              <p style={{ color: '#E6E6E6', fontSize: '1.25rem' }}>
                {complaints.length === 0 
                  ? 'No complaints yet. Create your first complaint!'
                  : 'No complaints match your filters.'}
              </p>
            </div>
          ) : (
            filteredAndSortedComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="rounded-lg p-4"
                style={{ backgroundColor: '#1F2022', border: '2px solid #E6E6E6' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold mb-2" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>
                      {complaint.complaintId}
                    </h3>
                    <p className="mb-2" style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.8 }}>
                      <span className="font-semibold">Caretaker:</span> {complaint.caretaker}
                    </p>
                    <div className="mb-2">
                      {getStatusBadge(complaint.status)}
                    </div>
                    <p className="mb-3" style={{ color: '#E6E6E6', fontSize: '0.875rem', opacity: 0.7 }}>
                      <span className="font-semibold">Last Update:</span> {complaint.lastUpdate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/customer/complaints/${complaint.id}`)}
                  className="w-full text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  style={{ 
                    backgroundColor: '#2AB3EE',
                    fontSize: '1.125rem',
                    padding: '12px 20px',
                    minHeight: '48px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F8FD0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2AB3EE'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
              <tr style={{ borderBottomColor: '#E6E6E6', borderWidth: '2px' }} className="border-b">
                <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Complaint ID</th>
                <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Caretaker</th>
                <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Status</th>
                <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Last Update</th>
                <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12" style={{ color: '#E6E6E6', fontSize: '1.25rem' }}>
                    {complaints.length === 0 
                      ? 'No complaints yet. Create your first complaint!'
                      : 'No complaints match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedComplaints.map((complaint) => (
                  <tr key={complaint.id} style={{ borderBottomColor: '#E6E6E6', borderWidth: '1px' }} className="border-b transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2022'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td className="py-5 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.complaintId}</td>
                    <td className="py-5 px-4" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.caretaker}</td>
                    <td className="py-5 px-4">{getStatusBadge(complaint.status)}</td>
                    <td className="py-5 px-4" style={{ color: '#E6E6E6', fontSize: '1rem' }}>{complaint.lastUpdate}</td>
                    <td className="py-5 px-4">
                      <button
                        onClick={() => router.push(`/customer/complaints/${complaint.id}`)}
                        className="text-white rounded-lg flex items-center gap-2 transition-colors"
                        style={{ 
                          backgroundColor: '#2A2B30',
                          fontSize: '1.125rem',
                          padding: '12px 20px',
                          minHeight: '48px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2022'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2A2B30'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
      </div>
    </Layout>
  );
}

