'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/Layout';
import { useApp } from '../../../../context/AppContext';
import { complaintService, dswService, clientService } from '../../../../../lib/services';
import { useDashboardStore } from '../../../../../lib/stores/dashboardStore';
import { useComplaintDetailStore } from '../../../../../lib/stores/complaintDetailStore';
import { ProblemType, Priority, Complaint } from '../../../../types';
import Loader from '../../../../components/Loader';
import Toast from '../../../../components/Toast';
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

// Helper function to map complaint from API response
const mapComplaintFromResponse = (item: Record<string, unknown>): Complaint => {
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
};

export default function AdminEditComplaintPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useApp();
  const { complaints: storeComplaints } = useDashboardStore();
  const { getComplaint, setComplaint: setComplaintInStore, isStale } = useComplaintDetailStore();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    dswId: '',
    clientId: '',
    typeOfProblem: '' as ProblemType | '',
    priority: 'Low' as Priority,
    description: '',
    remarks: '',
  });
  const [dsws, setDsws] = useState<Array<{ id: number | string; name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: number | string; name: string }>>([]);
  const [types, setTypes] = useState<Array<Record<string, unknown>>>([]);
  const [priorities, setPriorities] = useState<Array<Record<string, unknown>>>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dswSearch, setDswSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch complaint data
  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setLoading(true);
        const complaintId = params.id as string;
        const numericId = complaintId.replace('CMP-', '');
        
        // First try Zustand stores
        const cachedComplaint = getComplaint(complaintId) || getComplaint(numericId);
        const cachedId = getComplaint(complaintId) ? complaintId : numericId;
        if (cachedComplaint && cachedId && !isStale(cachedId)) {
          setComplaint(cachedComplaint);
          setFormData({
            dswId: '',
            clientId: '',
            typeOfProblem: cachedComplaint.typeOfProblem as ProblemType,
            priority: cachedComplaint.priority,
            description: cachedComplaint.description,
            remarks: '',
          });
          setLoading(false);
        } else {
          // Fetch from API
          const response = await complaintService.getById(complaintId);
          if (response.complaint) {
            const mappedComplaint = mapComplaintFromResponse(response.complaint);
            setComplaint(mappedComplaint);
            setComplaintInStore(complaintId, mappedComplaint);
            setFormData({
              dswId: '',
              clientId: '',
              typeOfProblem: mappedComplaint.typeOfProblem as ProblemType,
              priority: mappedComplaint.priority,
              description: mappedComplaint.description,
              remarks: '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching complaint:', error);
        setToast({ message: 'Failed to load complaint', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [params.id, getComplaint, setComplaintInStore, isStale]);

  // Fetch DSWs, Clients, Types, Priorities
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const [dswsResponse, clientsResponse, typesResponse, prioritiesResponse] = await Promise.all([
          dswService.getAll().catch(() => []),
          clientService.getAll().catch(() => []),
          complaintService.getTypes().catch(() => ({ data: [] })),
          complaintService.getPriorities().catch(() => ({ data: [] })),
        ]);

        const mappedDsws = Array.isArray(dswsResponse) ? dswsResponse.map((dsw: Record<string, unknown>) => ({
          id: Number(dsw.id || 0),
          name: String(dsw.name || dsw.first_name || dsw.username || ''),
        })) : [];
        setDsws(mappedDsws);

        const mappedClients = Array.isArray(clientsResponse) ? clientsResponse.map((client: Record<string, unknown>) => ({
          id: Number(client.id || 0),
          name: String(client.name || client.first_name || client.username || ''),
        })) : [];
        setClients(mappedClients);

        const apiTypes = typesResponse?.payload || typesResponse?.data || typesResponse;
        setTypes(Array.isArray(apiTypes) ? apiTypes : []);

        const apiPriorities = prioritiesResponse?.payload || prioritiesResponse?.data || prioritiesResponse;
        setPriorities(Array.isArray(apiPriorities) ? apiPriorities : []);
      } catch (error) {
        console.error('Error fetching form data:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, []);

  // Filter DSWs and Clients
  const filteredDsws = dsws.filter(dsw =>
    dsw.name.toLowerCase().includes(dswSearch.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Get type ID from type name
  const getTypeId = (typeName: ProblemType): number | undefined => {
    const type = types.find((t: Record<string, unknown>) => 
      (t.name as string)?.toLowerCase() === typeName.toLowerCase() || 
      (t.code as string)?.toLowerCase() === typeName.toLowerCase()
    );
    return type?.id as number | undefined;
  };

  // Get priority ID from priority name
  const getPriorityId = (priorityName: Priority): number | undefined => {
    const priority = priorities.find((p: Record<string, unknown>) => 
      (p.label as string)?.toLowerCase() === priorityName.toLowerCase() || 
      (p.code as string)?.toLowerCase() === priorityName.toLowerCase()
    );
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

    if (!typeId || !priorityId) {
      setToast({ message: 'Invalid type or priority selected', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const complaintId = typeof complaint.id === 'string' ? parseInt(complaint.id.replace('CMP-', '')) : complaint.id;
      
      const formDataToSend = new FormData();
      formDataToSend.append('complaint_id', String(complaintId));
      if (formData.dswId) formDataToSend.append('dsw_id', formData.dswId);
      if (formData.clientId) formDataToSend.append('client_id', formData.clientId);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('status_id', '1'); // Keep as Open for now
      formDataToSend.append('priority_id', String(priorityId));
      formDataToSend.append('type_id', String(typeId));
      formDataToSend.append('remarks', formData.remarks || `Complaint updated by ${currentUser?.name || 'admin'}`);
      formDataToSend.append('case_start_by', String(currentUser?.id || ''));

      // Add file attachments if any
      attachments.forEach((file) => {
        formDataToSend.append('file', file);
      });

      const response = await complaintService.update(formDataToSend);
      
      if (response?.status || response?.message) {
        // Refresh complaints list
        useDashboardStore.setState({ complaintsLastFetched: null });
        useComplaintDetailStore.setState({ lastFetched: { ...useComplaintDetailStore.getState().lastFetched, [String(complaintId)]: null } });
        setToast({ message: response?.message || 'Complaint updated successfully!', type: 'success' });
        setTimeout(() => {
          router.push(`/admin/complaints/${complaint.id}`);
        }, 1500);
      } else {
        throw new Error('Failed to update complaint');
      }
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

  if (loading || fetching) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  if (!complaint) {
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

  return (
    <Layout role="admin">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: '#E6E6E6' }}>Edit Complaint</h1>
        <div className="flex items-center gap-4 mb-8" style={{ color: '#E6E6E6', opacity: 0.8, fontSize: '1.125rem' }}>
          <span>Complaint ID: {complaint.complaintId}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DSW Selection */}
          <div>
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>DSW (Direct Service Worker)</label>
            <Select value={formData.dswId} onValueChange={(value) => setFormData({ ...formData, dswId: value })}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg focus-visible:!ring-0 focus-visible:ring-offset-0 data-[state=open]:!ring-0 data-[state=open]:shadow-none">
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
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Client</label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg focus-visible:!ring-0 focus-visible:ring-offset-0 data-[state=open]:!ring-0 data-[state=open]:shadow-none">
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
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Priority</label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg focus-visible:!ring-0 focus-visible:ring-offset-0 data-[state=open]:!ring-0 data-[state=open]:shadow-none">
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
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Describe What Happened *</label>
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
          </div>

          {/* Remarks */}
          <div>
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Remarks (Optional)</label>
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
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Attach Files (Optional)</label>
            {attachments.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {attachments.map((file, index) => (
                    <div key={index} className="relative rounded-lg p-3" style={{ backgroundColor: '#2A2B30', border: '2px solid #E6E6E6' }}>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#FF3F3F', color: '#E6E6E6' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                placeholder="Upload photos, PDFs, or documents (max 10MB per file)"
                readOnly
                value={attachments.length > 0 ? `${attachments.length} file(s) selected` : ''}
                className="w-full rounded-lg outline-none transition placeholder:opacity-50 pr-16"
                style={{ 
                  backgroundColor: '#1F2022', 
                  borderColor: '#E6E6E6', 
                  borderWidth: '2px', 
                  borderStyle: 'solid', 
                  color: '#E6E6E6',
                  fontSize: '1.125rem',
                  padding: '16px 20px',
                  minHeight: '56px'
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
                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer transition-opacity"
                style={{ 
                  color: '#E6E6E6',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
            </div>
            <p className="mt-2" style={{ color: '#E6E6E6', opacity: 0.7, fontSize: '1rem' }}>You can upload multiple files. Supported: Images, PDF, DOC, DOCX. Max 10MB per file.</p>
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

