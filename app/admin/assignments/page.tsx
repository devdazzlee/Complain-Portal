'use client';

import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { Complaint } from '../../types';
import PriorityBadge from '../../components/PriorityBadge';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import Pagination from '../../components/Pagination';

export default function AssignmentWorkflowPage() {
  const { complaints, users, assignComplaint, currentUser } = useApp();
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [complaintSearch, setComplaintSearch] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const itemsPerPage = 10;

  const unassignedComplaints = complaints.filter(c => !c.assignedTo && c.status === 'Open');
  const providers = users.filter(u => u.role === 'provider' || u.role === 'admin');

  // Filter complaints based on search
  const filteredComplaints = useMemo(() => {
    if (!complaintSearch.trim()) return unassignedComplaints;
    const searchLower = complaintSearch.toLowerCase();
    return unassignedComplaints.filter(complaint => 
      complaint.complaintId.toLowerCase().includes(searchLower) ||
      complaint.typeOfProblem.toLowerCase().includes(searchLower) ||
      complaint.caretaker.toLowerCase().includes(searchLower) ||
      (complaint.description && complaint.description.toLowerCase().includes(searchLower))
    );
  }, [unassignedComplaints, complaintSearch]);

  // Filter providers based on search
  const filteredProviders = useMemo(() => {
    if (!providerSearch.trim()) return providers;
    const searchLower = providerSearch.toLowerCase();
    return providers.filter(provider => 
      provider.name.toLowerCase().includes(searchLower) ||
      provider.email.toLowerCase().includes(searchLower) ||
      provider.role.toLowerCase().includes(searchLower)
    );
  }, [providers, providerSearch]);

  const totalPages = Math.ceil(unassignedComplaints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComplaints = unassignedComplaints.slice(startIndex, endIndex);

  const handleAssign = async () => {
    if (!selectedComplaint || !selectedProvider) {
      setToast({ message: 'Please select a complaint and provider', type: 'error' });
      return;
    }

    setLoading(true);
    const provider = users.find(u => u.id === selectedProvider);
    if (provider) {
      await new Promise(resolve => setTimeout(resolve, 500));
      assignComplaint(selectedComplaint, provider.id, provider.name);
      setToast({ message: `Complaint assigned to ${provider.name} successfully`, type: 'success' });
      setSelectedComplaint(null);
      setSelectedProvider('');
      setComplaintSearch('');
      setProviderSearch('');
    }
    setLoading(false);
  };

  return (
    <Layout role="admin">
      <div className="max-w-7xl mx-auto">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6" style={{ color: '#E6E6E6' }}>
          Assignment Workflow
        </h1>

        {/* Assignment Form */}
        <div className="rounded-lg p-4 md:p-6 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
          <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Assign Complaint</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Select Complaint</label>
              <Select value={selectedComplaint || ''} onValueChange={(value) => {
                setSelectedComplaint(value);
                setComplaintSearch('');
              }}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue placeholder="Select a complaint..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] max-h-80">
                  <div
                    className="px-3 py-2 sticky top-0 z-10"
                    style={{ backgroundColor: '#1F2022', borderBottom: '1px solid #2A2B30' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={complaintSearch}
                        onChange={(e) => setComplaintSearch(e.target.value)}
                        placeholder="Search complaints..."
                        className="w-full rounded-lg outline-none transition pr-10"
                        style={{ 
                          backgroundColor: '#0f1012', 
                          borderColor: '#2A2B30', 
                          borderWidth: '2px', 
                          borderStyle: 'solid', 
                          color: '#E6E6E6',
                          fontSize: '0.95rem',
                          padding: '10px 12px',
                          minHeight: '44px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
                        onBlur={(e) => e.target.style.borderColor = '#2A2B30'}
                      />
                      <svg 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ color: '#E6E6E6', opacity: 0.7 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  {filteredComplaints.length > 0 ? (
                    filteredComplaints.map(complaint => (
                      <SelectItem key={complaint.id} value={complaint.id} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                        {complaint.complaintId} - {complaint.typeOfProblem}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                      No complaints found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Select Provider</label>
              <Select value={selectedProvider} onValueChange={(value) => {
                setSelectedProvider(value);
                setProviderSearch('');
              }}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue placeholder="Select a provider..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] max-h-80">
                  <div
                    className="px-3 py-2 sticky top-0 z-10"
                    style={{ backgroundColor: '#1F2022', borderBottom: '1px solid #2A2B30' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={providerSearch}
                        onChange={(e) => setProviderSearch(e.target.value)}
                        placeholder="Search providers..."
                        className="w-full rounded-lg outline-none transition pr-10"
                        style={{ 
                          backgroundColor: '#0f1012', 
                          borderColor: '#2A2B30', 
                          borderWidth: '2px', 
                          borderStyle: 'solid', 
                          color: '#E6E6E6',
                          fontSize: '0.95rem',
                          padding: '10px 12px',
                          minHeight: '44px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
                        onBlur={(e) => e.target.style.borderColor = '#2A2B30'}
                      />
                      <svg 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ color: '#E6E6E6', opacity: 0.7 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  {filteredProviders.length > 0 ? (
                    filteredProviders.map(provider => (
                      <SelectItem key={provider.id} value={provider.id} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                        {provider.name} ({provider.role})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                      No providers found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={handleAssign}
              disabled={loading || !selectedComplaint || !selectedProvider}
              className="w-full px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg flex items-center justify-center gap-2"
              style={{
                backgroundColor: loading || !selectedComplaint || !selectedProvider ? '#2A2B30' : '#2AB3EE',
                color: '#E6E6E6',
                minHeight: '52px',
                opacity: loading || !selectedComplaint || !selectedProvider ? 0.5 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader size="sm" color="#FFFFFF" />
                  Assigning...
                </>
              ) : (
                'Assign Complaint'
              )}
            </button>
          </div>
        </div>

        {/* Unassigned Complaints List */}
        <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#2A2B30' }}>
          <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>
            Unassigned Complaints ({unassignedComplaints.length})
          </h2>
          
          {unassignedComplaints.length === 0 ? (
            <p className="text-base md:text-lg" style={{ color: '#E6E6E6', opacity: 0.7 }}>
              All complaints have been assigned
            </p>
          ) : (
            <>
              <div className="space-y-3 md:space-y-4">
                {paginatedComplaints.map(complaint => (
                <div
                  key={complaint.id}
                  className="rounded-lg p-4 cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: '#1F2022', border: '2px solid #E6E6E6' }}
                  onClick={() => window.location.href = `/admin/complaints/${complaint.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold mb-1 break-words" style={{ color: '#E6E6E6' }}>
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
                    <span>Caretaker: {complaint.caretaker}</span>
                    <span>Type: {complaint.typeOfProblem}</span>
                    <span>Date: {complaint.dateSubmitted}</span>
                  </div>
                </div>
              ))}
              </div>
              {unassignedComplaints.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={unassignedComplaints.length}
                />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

