'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '../../components/Layout';
import { assignmentService } from '../../../lib/services';
import { Complaint, ProblemType, ComplaintStatus } from '../../types';
import PriorityBadge from '../../components/PriorityBadge';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
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

  // Helper function to safely format dates
  const formatDate = useCallback((dateValue: unknown): string => {
    if (!dateValue) return new Date().toLocaleDateString();
    
    const dateStr = String(dateValue);
    if (!dateStr || dateStr.trim() === '') return new Date().toLocaleDateString();
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If date is invalid, try to parse it differently or return current date
      return new Date().toLocaleDateString();
    }
    
    return date.toLocaleDateString();
  }, []);

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
    
    // Try to get date from various possible fields
    const dateValue = latestHistory?.created_at || latestHistory?.createdAt || apiComplaint.created_at || apiComplaint.createdAt || apiComplaint.date || null;
    
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
      id: String(apiComplaint.id || ''),
      complaintId: `CMP-${apiComplaint.id || ''}`,
      caretaker: String(complainant),
      complaintAgainst: String(complaintAgainst),
      typeOfProblem: mappedType,
      description: String(apiComplaint.description || ''),
      status: mappedStatus,
      priority: String(priority?.label || priority?.code || 'Low') as 'Low' | 'Medium' | 'High' | 'Urgent',
      dateSubmitted: formatDate(dateValue),
      lastUpdate: formatDate(latestHistory?.updated_at || latestHistory?.created_at || apiComplaint.updated_at || apiComplaint.created_at || dateValue),
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
          date: formatDate(h.created_at || h.createdAt || h.date) || new Date().toISOString(),
          status: String(statusObj?.label || statusObj?.code || ''),
          description: String(h['Handler Remarks'] || h.remarks || ''),
          isCompleted: statusCode === 'closed',
          isRefused: statusCode === 'refused',
          userName: String(h['Case Handle By'] || h.handler || ''),
        };
      }) || [],
    };
  }, [formatDate]);

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
      const dataObj = assignedComplaintsData as Record<string, unknown>;
      if (dataObj.complaints) {
        const complaints = dataObj.complaints;
        if (Array.isArray(complaints)) {
          complaintsArray = complaints;
        } else if (complaints && typeof complaints === 'object') {
          complaintsArray = Object.values(complaints);
        }
      } else if (dataObj.data) {
        const data = dataObj.data;
        if (Array.isArray(data)) {
          complaintsArray = data;
        } else if (data && typeof data === 'object') {
          complaintsArray = Object.values(data);
        }
      } else {
        // Direct object with numeric keys
        complaintsArray = Object.values(dataObj);
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
    if (!allComplaintsRawData || !Array.isArray(allComplaintsRawData)) return;

    if (allComplaintsRawData.length > 0) {
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
            role: String((p.role as Record<string, unknown>)?.name || p.role || 'provider'),
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

  if (loading && !assignedComplaintsData) {
    return (
      <Layout role="provider">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="provider">
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
              <Select value={selectedComplaint || ''} onValueChange={(value) => setSelectedComplaint(value)}>
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
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  {allComplaintsLoading ? (
                    <div className="px-3 py-4 text-center" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                      Loading complaints...
                    </div>
                  ) : allComplaints.length === 0 ? (
                    <div className="px-3 py-4 text-center" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                      No complaints available
                    </div>
                  ) : (
                    allComplaints.map(complaint => {
                      const complaintWithAgainst = complaint as Complaint & { complaintAgainst?: string };
                      // Get values directly - ensure we have the data
                      const complainant = complaint.caretaker || 'N/A';
                      const complaintAgainst = complaintWithAgainst.complaintAgainst || 'N/A';
                      return (
                        <SelectItem key={complaint.id} value={complaint.id} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                          <div className="flex flex-col py-1">
                            <span className="font-semibold">{complaint.complaintId}</span>
                            <span className="text-sm opacity-80 mt-0.5">Complainant: {complainant}</span>
                            <span className="text-sm opacity-80">Complaint Against: {complaintAgainst}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Select Provider</label>
              <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value)}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue placeholder="Select a provider..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  {providers.map(provider => (
                    <SelectItem key={String(provider.id)} value={String(provider.id)} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                      {provider.name} ({provider.role || 'provider'})
                    </SelectItem>
                  ))}
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
            <div className="space-y-3 md:space-y-4">
              {assignedComplaints.map(complaint => (
                <div
                  key={complaint.id}
                  className="rounded-lg p-4 cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: '#1F2022', border: '2px solid #E6E6E6' }}
                  onClick={() => window.location.href = `/provider/complaints/${complaint.id}`}
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
          )}
        </div>
      </div>
    </Layout>
  );
}

