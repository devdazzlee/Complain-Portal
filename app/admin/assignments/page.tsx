'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '../../components/Layout';
import { assignmentService } from '../../../lib/services';
import { Complaint } from '../../types';
import PriorityBadge from '../../components/PriorityBadge';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import Pagination from '../../components/Pagination';
import { useAssignmentStore } from '../../../lib/stores/assignmentStore';
import { useAssignedComplaints } from '../../../lib/hooks/useAssignments';
import { useQuery } from '@tanstack/react-query';
import { complaintService } from '../../../lib/services';

export default function AssignmentWorkflowPage() {
  // Use React Query hook for assigned complaints (for the list below)
  const { data: assignedComplaintsData = [], isLoading: assignedComplaintsLoading } = useAssignedComplaints();
  
  // Use React Query hook for all complaints (for the Select Complaint dropdown) - get raw API data
  const { data: allComplaintsRawData, isLoading: allComplaintsLoading } = useQuery({
    queryKey: ['complaints', 'all-raw'],
    queryFn: async () => {
      const response = await complaintService.getAll();
      // Return raw complaints array from API
      // Handle response structure: { status, message, complaints: [...] }
      const complaints = response?.complaints || response?.data || response || [];
      return Array.isArray(complaints) ? complaints : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  
  const {
    providers,
    setProviders,
    isProvidersStale,
  } = useAssignmentStore();
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [complaintSearch, setComplaintSearch] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const itemsPerPage = 10;

  // Map API complaint to Complaint interface
  const mapComplaintFromAPI = useCallback((apiComplaint: Record<string, unknown>): Complaint & { complaintAgainst?: string } => {
    const history = apiComplaint.history as Array<Record<string, unknown>> | undefined;
    const latestHistory = history && history.length > 0 ? history[history.length - 1] : null;
    const status = latestHistory?.status as Record<string, unknown> | undefined;
    const type = apiComplaint.type as Record<string, unknown> | undefined;
    const priority = apiComplaint.priority as Record<string, unknown> | undefined;
    const files = apiComplaint.files as Array<Record<string, unknown>> | undefined;

    // Extract Complainant and Complaint Against with proper field name handling
    const complainant = apiComplaint['Complainant'] || apiComplaint.Complainant || apiComplaint.complainant || '';
    const complaintAgainst = apiComplaint['Complaint Against'] || apiComplaint['Complaint Against'] || apiComplaint.complaint_against || '';
    
    return {
      id: String(apiComplaint.id || ''),
      complaintId: `CMP-${apiComplaint.id || ''}`,
      caretaker: String(complainant),
      complaintAgainst: String(complaintAgainst),
      typeOfProblem: String(type?.name || type?.code || ''),
      description: String(apiComplaint.description || ''),
      status: String(status?.label || status?.code || 'Open'),
      priority: String(priority?.label || priority?.code || 'Low') as 'Low' | 'Medium' | 'High' | 'Urgent',
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
  }, []);

  // Map assigned complaints from API data (for the list section)
  // This uses data from /assigned-to-other-complaints API
  useEffect(() => {
    if (!assignedComplaintsData) return;

    // Handle different response structures
    let complaintsArray: any[] = [];
    if (Array.isArray(assignedComplaintsData)) {
      complaintsArray = assignedComplaintsData;
    } else if (assignedComplaintsData && typeof assignedComplaintsData === 'object') {
      // If it's an object (like { "0": {...}, "1": {...} }), convert to array
      if (assignedComplaintsData.complaints) {
        const complaints = assignedComplaintsData.complaints;
        if (Array.isArray(complaints)) {
          complaintsArray = complaints;
        } else if (complaints && typeof complaints === 'object') {
          complaintsArray = Object.values(complaints);
        }
      } else if (assignedComplaintsData.data) {
        const data = assignedComplaintsData.data;
        if (Array.isArray(data)) {
          complaintsArray = data;
        } else if (data && typeof data === 'object') {
          complaintsArray = Object.values(data);
        }
      } else {
        // Direct object with numeric keys
        complaintsArray = Object.values(assignedComplaintsData);
      }
    }

    if (complaintsArray.length > 0) {
      const mappedComplaints = complaintsArray.map(mapComplaintFromAPI);
      // Only update if the mapped data is different
      setAssignedComplaints(prev => {
        // Check if arrays are the same length and have same IDs
        if (prev.length === mappedComplaints.length) {
          const prevIds = prev.map(c => c.id).sort().join(',');
          const newIds = mappedComplaints.map(c => c.id).sort().join(',');
          if (prevIds === newIds) {
            return prev; // No change, return previous state
          }
        }
        return mappedComplaints;
      });
    } else {
      // Only clear if not already empty
      setAssignedComplaints(prev => {
        if (prev.length === 0) return prev;
        return [];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedComplaintsData]);

  // Map all complaints from API data (for the Select Complaint dropdown)
  useEffect(() => {
    if (!allComplaintsRawData) return;

    // allComplaintsRawData should already be an array from the query
    if (Array.isArray(allComplaintsRawData) && allComplaintsRawData.length > 0) {
      const mappedComplaints = allComplaintsRawData.map(mapComplaintFromAPI);
      // Only update if the mapped data is different
      setAllComplaints(prev => {
        // Check if arrays are the same length and have same IDs
        if (prev.length === mappedComplaints.length) {
          const prevIds = prev.map(c => c.id).sort().join(',');
          const newIds = mappedComplaints.map(c => c.id).sort().join(',');
          if (prevIds === newIds) {
            return prev; // No change, return previous state
          }
        }
        return mappedComplaints;
      });
    } else {
      // Only clear if not already empty
      setAllComplaints(prev => {
        if (prev.length === 0) return prev;
        return [];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplaintsRawData]);

  // Fetch providers (only if stale)
  useEffect(() => {
    const fetchProviders = async () => {
      const needProviders = providers.length === 0 || isProvidersStale();

      if (!needProviders) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const providersData = await assignmentService.getProviders();

        // Map providers
        if (Array.isArray(providersData)) {
          const mappedProviders = providersData.map((p: Record<string, unknown>) => ({
            id: Number(p.id || 0),
            name: String(p.first_name || p.name || p.username || '') + 
                  (p.last_name ? ` ${String(p.last_name)}` : ''),
            email: String(p.email || ''),
            role: String(p.role?.name || p.role || 'provider'),
          }));
          setProviders(mappedProviders);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        setToast({ 
          message: error instanceof Error ? error.message : 'Failed to load providers', 
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [providers.length, isProvidersStale, setProviders]);

  // Filter complaints for the Select Complaint dropdown
  const filteredComplaintsForSelect = useMemo(() => {
    if (!complaintSearch.trim()) return allComplaints;
    const searchLower = complaintSearch.toLowerCase();
    return allComplaints.filter(complaint => 
      complaint.complaintId.toLowerCase().includes(searchLower) ||
      complaint.typeOfProblem.toLowerCase().includes(searchLower) ||
      complaint.caretaker.toLowerCase().includes(searchLower) ||
      (complaint.description && complaint.description.toLowerCase().includes(searchLower))
    );
  }, [allComplaints, complaintSearch]);

  // Filter assigned complaints for the list section
  const filteredAssignedComplaints = useMemo(() => {
    if (!complaintSearch.trim()) return assignedComplaints;
    const searchLower = complaintSearch.toLowerCase();
    return assignedComplaints.filter(complaint => 
      complaint.complaintId.toLowerCase().includes(searchLower) ||
      complaint.typeOfProblem.toLowerCase().includes(searchLower) ||
      complaint.caretaker.toLowerCase().includes(searchLower) ||
      (complaint.description && complaint.description.toLowerCase().includes(searchLower))
    );
  }, [assignedComplaints, complaintSearch]);

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

  const totalPages = Math.ceil(filteredAssignedComplaints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComplaints = filteredAssignedComplaints.slice(startIndex, endIndex);

  const handleAssign = async () => {
    if (!selectedComplaint || !selectedProvider) {
      setToast({ message: 'Please select a complaint and provider', type: 'error' });
      return;
    }

    try {
      setAssigning(true);
      const complaintId = parseInt(selectedComplaint.replace('CMP-', ''));
      const providerId = typeof selectedProvider === 'string' ? parseInt(selectedProvider) : selectedProvider;
      const provider = providers.find(p => p.id === providerId);

      if (!provider) {
        setToast({ message: 'Provider not found', type: 'error' });
        return;
      }

      await assignmentService.assignComplaint(complaintId, providerId, `Complaint assigned to ${provider.name}`);

      // Refresh assigned complaints - React Query will handle this automatically
      // The mutation will invalidate the query cache

      setToast({ message: `Complaint assigned to ${provider.name} successfully`, type: 'success' });
      setSelectedComplaint(null);
      setSelectedProvider('');
      setComplaintSearch('');
      setProviderSearch('');
      setCurrentPage(1);
    } catch (error) {
      console.error('Error assigning complaint:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to assign complaint', 
        type: 'error' 
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader />
        </div>
      </Layout>
    );
  }

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
                  <SelectValue placeholder="Select a complaint...">
                    {selectedComplaint ? (() => {
                      const selected = allComplaints.find(c => c.id === selectedComplaint) as (Complaint & { complaintAgainst?: string }) | undefined;
                      if (selected) {
                        return `${selected.complaintId} - Complainant: ${selected.caretaker} - Complaint Against: ${selected.complaintAgainst || 'N/A'}`;
                      }
                      return 'Select a complaint...';
                    })() : 'Select a complaint...'}
                  </SelectValue>
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
                  {allComplaintsLoading ? (
                    <div className="px-3 py-4 text-center" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                      Loading complaints...
                    </div>
                  ) : filteredComplaintsForSelect.length > 0 ? (
                    filteredComplaintsForSelect.map(complaint => {
                      const complaintWithAgainst = complaint as Complaint & { complaintAgainst?: string };
                      // Get values directly - ensure we have the data
                      const complainant = complaint.caretaker || 'N/A';
                      const complaintAgainst = complaintWithAgainst.complaintAgainst || 'N/A';
                      return (
                      <SelectItem key={complaint.id} value={complaint.id} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30] focus:outline-none focus:ring-0 focus:border-0 hover:outline-none hover:ring-0 hover:border-0">
                          <div className="flex flex-col py-1">
                            <span className="font-semibold">{complaint.complaintId}</span>
                            <span className="text-sm opacity-80 mt-0.5">Complainant: {complainant}</span>
                            <span className="text-sm opacity-80">Complaint Against: {complaintAgainst}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className="px-3 py-4 text-center" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                      {complaintSearch ? 'No complaints found matching your search' : 'No complaints available'}
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
                      <SelectItem key={String(provider.id)} value={String(provider.id)} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30] focus:outline-none focus:ring-0 focus:border-0 hover:outline-none hover:ring-0 hover:border-0">
                        {provider.name} ({provider.role || 'provider'})
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
              disabled={assigning || !selectedComplaint || !selectedProvider}
              className="w-full px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg flex items-center justify-center gap-2"
              style={{
                backgroundColor: assigning || !selectedComplaint || !selectedProvider ? '#2A2B30' : '#2AB3EE',
                color: '#E6E6E6',
                minHeight: '52px',
                opacity: assigning || !selectedComplaint || !selectedProvider ? 0.5 : 1,
              }}
            >
              {assigning ? (
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

        {/* Assigned Complaints List */}
        <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#2A2B30' }}>
          <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>
            Assigned Complaints ({assignedComplaints.length})
          </h2>
          
          {assignedComplaintsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader size="md" />
            </div>
          ) : assignedComplaints.length === 0 ? (
            <p className="text-base md:text-lg" style={{ color: '#E6E6E6', opacity: 0.7 }}>
              No assigned complaints available
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
              {filteredAssignedComplaints.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredAssignedComplaints.length}
                />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

