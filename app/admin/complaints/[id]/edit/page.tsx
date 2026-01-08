'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/Layout';
import { useApp } from '../../../../context/AppContext';
import { complaintService } from '../../../../../lib/services';
import { useDashboardStore } from '../../../../../lib/stores/dashboardStore';
import { useComplaintDetailStore } from '../../../../../lib/stores/complaintDetailStore';
import { ProblemType, Priority, Complaint, ComplaintStatus } from '../../../../types';
import Loader from '../../../../components/Loader';
import Toast from '../../../../components/Toast';
import { VoiceRecognition } from '../../../../utils/voiceRecognition';
import { useComplaint, useDsws, useClients, useTypes, usePriorities, useUpdateComplaint, useComplaintStatuses } from '../../../../../lib/hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const problemTypes: { type: ProblemType; icon: string; label: string }[] = [
  { type: 'Late arrival', icon: '🕐', label: 'Late arrival' },
  { type: 'Behavior', icon: '😞', label: 'Behavior' },
  { type: 'Missed service', icon: '💊', label: 'Missed service' },
  { type: 'Other', icon: '🏠', label: 'Other' },
];

// Helper function to map complaint from API response with raw data preserved
const mapComplaintFromResponse = (item: Record<string, unknown>): Complaint & { rawData?: Record<string, unknown> } => {
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
    status: String(status?.label || status?.code || 'Open'),
    priority: String(priority?.label || priority?.code || 'Low') as Priority,
    dateSubmitted: latestHistory ? new Date(String(latestHistory.created_at || '')).toLocaleDateString() : new Date().toLocaleDateString(),
    lastUpdate: latestHistory ? new Date(String(latestHistory.updated_at || latestHistory.created_at || '')).toLocaleDateString() : new Date().toLocaleDateString(),
    assignedTo: String(latestHistory?.['Case Handle By'] || ''),
    attachments: files?.map((f: Record<string, unknown>) => ({
      id: String(f.id || ''),
      name: (f.file_name as string) || '',
      url: (f.url as string) || '',
      type: (f.type as string) || 'image',
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
    rawData: item, // Preserve raw API data for extracting IDs
  } as Complaint & { rawData?: Record<string, unknown> };
};

export default function AdminEditComplaintPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useApp();
  const complaintId = params.id as string;
  const numericId = complaintId.replace('CMP-', '');
  
  // Use React Query hooks
  const { data: complaintData, isLoading: complaintLoading } = useComplaint(numericId);
  const { data: dsws = [], isLoading: dswsLoading } = useDsws();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: types = [], isLoading: typesLoading } = useTypes();
  const { data: priorities = [], isLoading: prioritiesLoading } = usePriorities();
  const { data: statuses = [], isLoading: statusesLoading } = useComplaintStatuses();
  const updateComplaintMutation = useUpdateComplaint();
  
  const [complaint, setComplaint] = useState<Complaint & { rawData?: Record<string, unknown> } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    dswId: '',
    clientId: '',
    typeOfProblem: '' as ProblemType | '',
    priority: 'Low' as Priority,
    status: '' as string, // Store status ID as string
    description: '',
    remarks: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [dswSearch, setDswSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecognitionRef = useRef<VoiceRecognition | null>(null);

  // Initialize VoiceRecognition
  useEffect(() => {
    voiceRecognitionRef.current = new VoiceRecognition();
    return () => {
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stop();
      }
    };
  }, []);

  // Populate form when complaint data is loaded
  useEffect(() => {
    if (complaintData) {
      const mappedComplaint = mapComplaintFromResponse(complaintData as any);
      setComplaint(mappedComplaint);
      
      // Extract DSW and Client IDs directly from API response
      // Use the raw complaintData directly (it contains worker_id and client_id)
      const rawData = complaintData as any;
      
      // Get DSW ID - API returns worker_id
      let foundDswId = '';
      if (rawData?.worker_id) {
        foundDswId = String(rawData.worker_id);
      } else if (rawData?.dsw_id) {
        foundDswId = String(rawData.dsw_id);
      } else if (rawData?.dswId) {
        foundDswId = String(rawData.dswId);
      } else if (rawData?.dsw?.id) {
        foundDswId = String(rawData.dsw.id);
      } else {
        // Fall back to name matching if ID not available
        const complaintAgainst = String(rawData?.['Complaint Against'] || rawData?.complaint_against || '');
        if (complaintAgainst && dsws.length > 0) {
          const dswMatch = dsws.find(dsw => {
            const dswName = dsw.name.toLowerCase();
            const againstName = complaintAgainst.toLowerCase();
            return againstName.includes(dswName) || dswName.includes(againstName.split(' - ')[0]);
          });
          if (dswMatch) {
            foundDswId = String(dswMatch.id);
          }
        }
      }
      
      // Get Client ID - API returns client_id
      let foundClientId = '';
      if (rawData?.client_id) {
        foundClientId = String(rawData.client_id);
      } else if (rawData?.clientId) {
        foundClientId = String(rawData.clientId);
      } else if (rawData?.client?.id) {
        foundClientId = String(rawData.client.id);
      } else {
        // Fall back to name matching if ID not available
        const complainantName = String(rawData?.['Complainant'] || rawData?.complainant || mappedComplaint.caretaker || '');
        if (complainantName && clients.length > 0) {
          const clientMatch = clients.find(client => {
            const clientName = client.name.toLowerCase();
            const complainant = complainantName.toLowerCase();
            return complainant.includes(clientName) || clientName.includes(complainant.split(' - ')[0]);
          });
          if (clientMatch) {
            foundClientId = String(clientMatch.id);
          }
        }
      }
      
      // Get type and priority IDs
      const typeId = types.find((t: Record<string, unknown>) => 
        (t.name as string)?.toLowerCase() === mappedComplaint.typeOfProblem.toLowerCase() || 
        (t.code as string)?.toLowerCase() === mappedComplaint.typeOfProblem.toLowerCase()
      );
      
      const priorityId = priorities.find((p: Record<string, unknown>) => 
        (p.label as string)?.toLowerCase() === mappedComplaint.priority.toLowerCase() || 
        (p.code as string)?.toLowerCase() === mappedComplaint.priority.toLowerCase()
      );
      
      // Get status ID from API response
      const complaintRawData = complaintData as any;
      const history = (complaintRawData?.history as Array<Record<string, unknown>>) || [];
      const latestStatus = history.length > 0 ? history[history.length - 1]?.status as Record<string, unknown> : null;
      const statusId = latestStatus?.id || latestStatus?.status_id || complaintRawData?.status_id || '1';
      
      setFormData({
        dswId: foundDswId,
        clientId: foundClientId,
        typeOfProblem: mappedComplaint.typeOfProblem as ProblemType,
        priority: mappedComplaint.priority,
        status: String(statusId), // Store status ID
        description: mappedComplaint.description,
        remarks: mappedComplaint.timeline?.[0]?.description || '',
      });
    }
  }, [complaintData, dsws, clients, types, priorities]);

  // Filter DSWs and Clients
  const filteredDsws = dsws.filter(dsw =>
    dsw.name.toLowerCase().includes(dswSearch.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Get type ID from type name
  const getTypeId = (typeName: ProblemType): number | undefined => {
    if (!typeName) return undefined;
    const type = types.find((t: Record<string, unknown>) => {
      const tName = (t.name as string)?.toLowerCase() || '';
      const tCode = (t.code as string)?.toLowerCase() || '';
      const searchName = typeName.toLowerCase();
      return tName === searchName || tCode === searchName || 
             (typeName === 'Late arrival' && (tName.includes('late') || tCode.includes('late')));
    });
    return type?.id as number | undefined;
  };

  // Get status ID from formData (which now stores status ID as string)
  const getStatusId = (statusIdOrName: string | ComplaintStatus): number | undefined => {
    if (!statusIdOrName) return undefined;
    // If it's already a number (ID), return it
    const numericId = parseInt(String(statusIdOrName), 10);
    if (!isNaN(numericId)) {
      const status = statuses.find((s: Record<string, unknown>) => 
        s.id === numericId || s.status_id === numericId
      );
      return (status?.id as number) || (status?.status_id as number) || numericId;
    }
    // Otherwise, search by name (for backward compatibility)
    const statusName = String(statusIdOrName).toLowerCase();
    const status = statuses.find((s: Record<string, unknown>) => {
      const label = String(s.label || s.name || s.code || '').toLowerCase();
      return label.includes(statusName) || 
             (statusName === 'open' && label.includes('open')) ||
             (statusName === 'in progress' && (label.includes('progress') || label.includes('pending') || label.includes('hold'))) ||
             (statusName === 'closed' && (label.includes('closed') || label.includes('resolved'))) ||
             (statusName === 'refused' && (label.includes('refused') || label.includes('rejected')));
    });
    return (status?.id as number) || (status?.status_id as number) || undefined;
  };

  // Get priority ID from priority name
  const getPriorityId = (priorityName: Priority): number | undefined => {
    if (!priorityName) return undefined;
    const priority = priorities.find((p: Record<string, unknown>) => {
      const pLabel = (p.label as string)?.toLowerCase() || '';
      const pCode = (p.code as string)?.toLowerCase() || '';
      const pName = (p.name as string)?.toLowerCase() || '';
      const searchName = priorityName.toLowerCase();
      return pLabel === searchName || pCode === searchName || pName === searchName;
    });
    return priority?.id as number | undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!complaint || !formData.typeOfProblem || !formData.description.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    const typeId = getTypeId(formData.typeOfProblem);
    const priorityId = getPriorityId(formData.priority);
    const statusId = getStatusId(formData.status);

    if (!typeId || !priorityId || !statusId) {
      setToast({ message: 'Invalid type, priority, or status selected', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const complaintId = parseInt(numericId);
      
      const formDataToSend = new FormData();
      formDataToSend.append('complaint_id', String(complaintId));
      if (formData.dswId) formDataToSend.append('dsw_id', formData.dswId);
      if (formData.clientId) formDataToSend.append('client_id', formData.clientId);
      formDataToSend.append('description', formData.description);
      
      // Use status from formData (already calculated above)
      formDataToSend.append('status_id', String(statusId));
      
      formDataToSend.append('priority_id', String(priorityId));
      formDataToSend.append('type_id', String(typeId));
      formDataToSend.append('remarks', formData.remarks || `Complaint updated by ${currentUser?.name || 'admin'}`);
      formDataToSend.append('case_start_by', String(currentUser?.id || ''));

      // Add file attachments if any
      attachments.forEach((file) => {
        formDataToSend.append('file', file);
      });

      await updateComplaintMutation.mutateAsync(formDataToSend);
      
      setToast({ message: 'Complaint updated successfully!', type: 'success' });
        setTimeout(() => {
          router.push(`/admin/complaints/${complaint.id}`);
        }, 1500);
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      setToast({ 
        message: error?.response?.data?.message || error?.message || 'Failed to update complaint', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    const invalidFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setToast({ message: `Some files are too large (max 10MB per file)`, type: 'error' });
      return;
    }

    const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const invalidTypes = fileArray.filter(file => !allowedTypes.some(type => file.type.startsWith(type)));
    if (invalidTypes.length > 0) {
      setToast({ message: `Some file types are not supported`, type: 'error' });
      return;
    }

    setAttachments(prev => [...prev, ...fileArray]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceInput = () => {
    if (!voiceRecognitionRef.current) return;

    if (isRecording) {
      voiceRecognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    voiceRecognitionRef.current.start(
      (text) => {
        setFormData({ ...formData, description: formData.description + (formData.description ? ' ' : '') + text });
        setIsRecording(false);
        setToast({ message: 'Voice input captured successfully!', type: 'success' });
      },
      (error) => {
        setIsRecording(false);
        setToast({ message: error, type: 'error' });
      }
    );
  };

  const isLoading = complaintLoading || dswsLoading || clientsLoading || typesLoading || prioritiesLoading;

  // Show loading if:
  // 1. Any query is still loading, OR
  // 2. complaintData exists but complaint hasn't been set yet (useEffect is processing)
  if (isLoading || (complaintData && !complaint)) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  // Only show "not found" if loading is complete and there's no complaintData
  if (!complaintLoading && !complaintData) {
    return (
      <Layout role="admin">
        <div className="text-center py-16">
          <p style={{ color: '#E6E6E6', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Complaint not found</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="rounded-lg font-semibold transition-colors"
            style={{ 
              color: '#2AB3EE',
              fontSize: '1.125rem',
              padding: '14px 28px',
              minHeight: '56px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1F8FD0'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#2AB3EE'}
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // TypeScript guard: ensure complaint is not null
  if (!complaint) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3" style={{ color: '#E6E6E6' }}>Edit Complaint</h1>
        <div className="flex items-center gap-4 mb-8" style={{ color: '#E6E6E6', opacity: 0.8, fontSize: '1.125rem' }}>
          <span>Complaint ID: {complaint.complaintId}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* DSW Selection */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>DSW (Direct Service Worker)</label>
            <Select value={formData.dswId} onValueChange={(value) => setFormData({ ...formData, dswId: value })}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus-visible:!ring-0 focus-visible:ring-offset-0 data-[state=open]:!ring-0 data-[state=open]:shadow-none">
                <SelectValue placeholder="Search or select DSW..." />
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
                      value={dswSearch}
                      onChange={(e) => setDswSearch(e.target.value)}
                      placeholder="Search DSWs..."
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
                {filteredDsws.length > 0 ? (
                  filteredDsws.map((dsw) => (
                    <SelectItem 
                      key={dsw.id} 
                      value={String(dsw.id)} 
                      className="focus:bg-[#2A2B30] rounded-lg mx-2 my-1"
                      style={{
                        border: 'none',
                        padding: '10px 12px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2A2B30';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {dsw.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-dsws" disabled className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                    No DSWs found matching "{dswSearch}"
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Client Selection */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>Client</label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus-visible:!ring-0 focus-visible:ring-offset-0 data-[state=open]:!ring-0 data-[state=open]:shadow-none">
                <SelectValue placeholder="Search or select client..." />
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
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search clients..."
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
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <SelectItem 
                      key={client.id} 
                      value={String(client.id)} 
                      className="focus:bg-[#2A2B30] rounded-lg mx-2 my-1"
                      style={{
                        border: 'none',
                        padding: '10px 12px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2A2B30';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {client.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-clients" disabled className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                    No clients found matching "{clientSearch}"
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>Priority</label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus-visible:!ring-0 focus-visible:ring-offset-0 data-[state=open]:!ring-0 data-[state=open]:shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                <SelectItem value="Low" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Low</SelectItem>
                <SelectItem value="Medium" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Medium</SelectItem>
                <SelectItem value="High" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">High</SelectItem>
                <SelectItem value="Urgent" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>Status *</label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus-visible:!ring-0 focus-visible:ring-offset-0 data-[state=open]:!ring-0 data-[state=open]:shadow-none">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] max-h-80">
                {statusesLoading ? (
                  <SelectItem value="loading" disabled className="focus:bg-[#2A2B30]">Loading statuses...</SelectItem>
                ) : Array.isArray(statuses) && statuses.length > 0 ? (
                  statuses.map((status: Record<string, unknown>) => {
                    const statusLabel = String(status.label || status.name || status.code || '');
                    const statusId = String(status.id || status.status_id || '');
                    return (
                      <SelectItem 
                        key={statusId} 
                        value={statusId}
                        className="focus:bg-[#2A2B30] rounded-lg mx-2 my-1"
                        style={{
                          border: 'none',
                          padding: '10px 12px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2A2B30';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {statusLabel}
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="Open" className="focus:bg-[#2A2B30]">Open</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Type of Problem */}
          <div>
            <label className="block mb-4" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Choose one of the options *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {problemTypes.map((pt) => (
                <button
                  key={pt.type}
                  type="button"
                  onClick={() => setFormData({ ...formData, typeOfProblem: pt.type })}
                  className="rounded-lg border-2 transition-all"
                  style={{
                    borderColor: formData.typeOfProblem === pt.type ? '#2AB3EE' : '#E6E6E6',
                    backgroundColor: formData.typeOfProblem === pt.type ? 'rgba(42, 179, 238, 0.2)' : 'transparent',
                    borderWidth: '2px',
                    padding: '20px 16px',
                    minHeight: '100px'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.typeOfProblem !== pt.type) {
                      e.currentTarget.style.borderColor = '#2AB3EE';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.typeOfProblem !== pt.type) {
                      e.currentTarget.style.borderColor = '#E6E6E6';
                    }
                  }}
                >
                  <div className="text-3xl md:text-4xl mb-2">{pt.icon}</div>
                  <div style={{ color: '#E6E6E6', fontSize: '1rem', fontWeight: 500 }}>{pt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>Describe What Happened *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please tell us what happened"
              rows={8}
              required
              className="w-full rounded-lg outline-none transition resize-none placeholder:opacity-50"
              style={{ 
                backgroundColor: '#1F2022', 
                borderColor: '#E6E6E6', 
                borderWidth: '2px', 
                borderStyle: 'solid', 
                color: '#E6E6E6',
                fontSize: '1.125rem',
                padding: '16px 20px',
                minHeight: '180px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
              onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
            />
            
            {/* Voice Options */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleVoiceInput}
                className="w-full rounded-lg transition-all flex items-center justify-center gap-3 p-4 md:p-5 relative overflow-hidden"
                style={{
                  backgroundColor: isRecording ? '#FF3F3F' : '#2AB3EE',
                  border: 'none',
                  minHeight: '60px',
                  boxShadow: isRecording 
                    ? '0 4px 20px rgba(255, 63, 63, 0.4)' 
                    : '0 4px 15px rgba(42, 179, 238, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!isRecording) {
                    e.currentTarget.style.backgroundColor = '#1F8FD0';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(42, 179, 238, 0.5)';
                  } else {
                    e.currentTarget.style.backgroundColor = '#FF1F1F';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 63, 63, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRecording) {
                    e.currentTarget.style.backgroundColor = '#2AB3EE';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(42, 179, 238, 0.3)';
                  } else {
                    e.currentTarget.style.backgroundColor = '#FF3F3F';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 63, 63, 0.4)';
                  }
                }}
              >
                {isRecording ? (
                  <>
                    <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                    <span className="text-base md:text-lg font-bold text-white">Stop Recording</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="text-base md:text-lg font-bold text-white">Record Voice</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>Remarks (Optional)</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Additional remarks or notes"
              rows={4}
              className="w-full rounded-lg outline-none transition resize-none placeholder:opacity-50"
              style={{ 
                backgroundColor: '#1F2022', 
                borderColor: '#E6E6E6', 
                borderWidth: '2px', 
                borderStyle: 'solid', 
                color: '#E6E6E6',
                fontSize: '1.125rem',
                padding: '16px 20px',
                minHeight: '120px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
              onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>Attach Files (Optional)</label>
            {attachments.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {attachments.map((file, index) => (
                    <div key={index} className="relative rounded-lg p-3" style={{ backgroundColor: '#2A2B30', border: '2px solid #E6E6E6' }}>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-2 right-2 flex items-center justify-center"
                        style={{ color: '#FFFFFF' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <p className="text-sm break-words pr-6" style={{ color: '#E6E6E6' }}>{file.name}</p>
                      <p className="text-xs mt-1" style={{ color: '#E6E6E6', opacity: 0.7 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Upload photos and documents"
                readOnly
                value={attachments.length > 0 ? `${attachments.length} file(s) selected` : ''}
                className="w-full rounded-lg outline-none transition placeholder:opacity-50 text-sm sm:text-base md:text-lg pr-12 sm:pr-14 md:pr-16 py-3 px-4 sm:py-3.5 sm:px-4.5 md:py-4 md:px-5 min-h-[48px] sm:min-h-[52px] md:min-h-[56px]"
                style={{ 
                  backgroundColor: '#1F2022', 
                  borderColor: '#E6E6E6', 
                  borderWidth: '2px', 
                  borderStyle: 'solid', 
                  color: '#E6E6E6'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
                onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
                onClick={() => fileInputRef.current?.click()}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="sr-only"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-2 sm:right-3 md:right-4 top-1/2 transform -translate-y-1/2 cursor-pointer transition-opacity flex items-center justify-center min-w-[36px] sm:min-w-[40px] md:min-w-[44px] min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
                style={{ 
                  color: '#E6E6E6'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-xs sm:text-sm md:text-base" style={{ color: '#E6E6E6', opacity: 0.7 }}>You can upload multiple files. Supported: Images, PDF, DOC, DOCX. Max 10MB per file.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-3"
              style={{ 
                backgroundColor: '#2A2B30',
                fontSize: '1.125rem',
                padding: '16px 28px',
                minHeight: '60px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2022'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2A2B30'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.typeOfProblem || !formData.description.trim()}
              className="flex-1 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ 
                backgroundColor: submitting ? '#2A2B30' : '#009200',
                fontSize: '1.125rem',
                padding: '16px 28px',
                minHeight: '60px'
              }}
              onMouseEnter={(e) => !submitting && !(!formData.typeOfProblem || !formData.description.trim()) && (e.currentTarget.style.backgroundColor = '#007700')}
              onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#009200')}
            >
              {submitting ? (
                <>
                  <Loader size="sm" color="#FFFFFF" />
                  Updating...
                </>
              ) : (
                <>
                  Update Complaint
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}

