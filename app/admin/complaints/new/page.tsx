'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '../../../components/Layout';
import { useApp } from '../../../context/AppContext';
import { complaintService } from '../../../../lib/services';
import { ProblemType, Priority } from '../../../types';
import Loader from '../../../components/Loader';
import Toast from '../../../components/Toast';
import FileGallery from '../../../components/FileGallery';
import { useDashboardStore } from '../../../../lib/stores/dashboardStore';
import { useDsws, useClients, useTypes, usePriorities, useAddType } from '../../../../lib/hooks';

// Helper function to get icon for type code/name
const getTypeIcon = (code: string, name: string): string => {
  const codeLower = code.toLowerCase();
  const nameLower = name.toLowerCase();
  
  if (codeLower.includes('late') || nameLower.includes('late')) return '🕐';
  if (codeLower.includes('behavior') || nameLower.includes('behavior')) return '😞';
  if (codeLower.includes('missed') || nameLower.includes('missed')) return '💊';
  if (codeLower.includes('service') && !codeLower.includes('missed')) return '🏥';
  return '🏠'; // Default icon for "Other" or unknown types
};

export default function NewComplaintPage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const { setComplaints, isComplaintsStale } = useDashboardStore();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    dswId: '',
    clientId: '',
    typeOfProblem: '' as ProblemType | '',
    priority: 'Low' as Priority,
    description: '',
    remarks: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dswSearch, setDswSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use React Query hooks for non-blocking data fetching
  const { data: dsws = [], isLoading: dswsLoading, error: dswsError } = useDsws();
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useClients();
  const { data: types = [], isLoading: typesLoading, error: typesError } = useTypes();
  const { data: priorities = [], isLoading: prioritiesLoading, error: prioritiesError } = usePriorities();

  // Show toast if any data fails to load (non-blocking)
  useEffect(() => {
    if (dswsError || clientsError || typesError || prioritiesError) {
      const errors = [dswsError, clientsError, typesError, prioritiesError].filter(Boolean);
      if (errors.length > 0) {
        setToast({ 
          message: 'Some form data failed to load. You can still submit the form.', 
          type: 'info' 
        });
      }
    }
  }, [dswsError, clientsError, typesError, prioritiesError]);

  // Filter DSWs and Clients based on search
  const filteredDsws = dsws.filter(dsw =>
    dsw.name.toLowerCase().includes(dswSearch.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Get type ID from type name or ID
  const getTypeId = (typeValue: string): number | undefined => {
    // If it's already a number (ID), return it
    const numericId = parseInt(typeValue, 10);
    if (!isNaN(numericId)) {
      const type = types.find((t: Record<string, unknown>) => t.id === numericId);
      return type?.id as number | undefined;
    }
    
    // Otherwise, search by name or code
    const type = types.find((t: Record<string, unknown>) => 
      (t.name as string)?.toLowerCase() === typeValue.toLowerCase() || 
      (t.code as string)?.toLowerCase() === typeValue.toLowerCase()
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
    
    if (!formData.dswId || !formData.clientId || !formData.typeOfProblem || !formData.description.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    const typeId = getTypeId(formData.typeOfProblem);
    const priorityId = getPriorityId(formData.priority);

    if (!typeId || !priorityId) {
      setToast({ message: 'Invalid type or priority selected', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('dsw_id', formData.dswId);
      formDataToSend.append('client_id', formData.clientId);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('case_start_by', String(currentUser?.id || ''));
      formDataToSend.append('status_id', '1'); // Open
      formDataToSend.append('priority_id', String(priorityId));
      formDataToSend.append('type_id', String(typeId));
      formDataToSend.append('remarks', formData.remarks || `Complaint created by ${currentUser?.name || 'admin'}`);

      // Add file attachments
      attachments.forEach((file) => {
        formDataToSend.append('file', file);
      });

      const response = await complaintService.add(formDataToSend);
      
      if (response?.status || response?.message) {
        // Refresh complaints list
        useDashboardStore.setState({ complaintsLastFetched: null });
        setToast({ message: response?.message || 'Complaint submitted successfully!', type: 'success' });
        setTimeout(() => {
          router.push('/admin/complaints');
        }, 1500);
      } else {
        throw new Error('Failed to create complaint');
      }
    } catch (error: any) {
      console.error('Error creating complaint:', error);
      setToast({ 
        message: error?.response?.data?.message || error?.message || 'Failed to create complaint', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate file size (max 10MB per file)
    const invalidFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setToast({ message: `Some files are too large (max 10MB per file)`, type: 'error' });
      return;
    }

    // Validate file type
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

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Don't block the UI - show form immediately, data loads in background
  // Form fields will show loading states individually if needed

  return (
    <Layout role="admin">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3" style={{ color: '#E6E6E6' }}>Create New Complaint</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6 md:mb-8 text-base md:text-lg" style={{ color: '#E6E6E6', opacity: 0.8 }}>
          <span>Date: {dateStr}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DSW Selection */}
          <div>
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>DSW (Direct Service Worker) *</label>
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
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Client *</label>
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

          {/* Type of Problem */}
          <div>
            <label className="block mb-4" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Choose one of the options *</label>
            {typesLoading ? (
              <div className="text-center py-8">
                <p style={{ color: '#E6E6E6', opacity: 0.7 }}>Loading types...</p>
              </div>
            ) : types.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: '#E6E6E6', opacity: 0.7 }}>No types available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {types.map((type: Record<string, unknown>) => {
                  const typeId = String(type.id || '');
                  const typeName = String(type.name || type.code || '');
                  const typeCode = String(type.code || '');
                  const isSelected = formData.typeOfProblem === typeId || formData.typeOfProblem === typeName;
                  const icon = getTypeIcon(typeCode, typeName);
                  
                  return (
                    <button
                      key={typeId}
                      type="button"
                      onClick={() => setFormData({ ...formData, typeOfProblem: typeId })}
                      className="rounded-lg border-2 transition-all"
                      style={{
                        borderColor: isSelected ? '#2AB3EE' : '#E6E6E6',
                        backgroundColor: isSelected ? 'rgba(42, 179, 238, 0.2)' : 'transparent',
                        borderWidth: '2px',
                        padding: '20px 16px',
                        minHeight: '100px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#2AB3EE';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#E6E6E6';
                        }
                      }}
                    >
                      <div className="text-3xl md:text-4xl mb-2">{icon}</div>
                      <div style={{ color: '#E6E6E6', fontSize: '1rem', fontWeight: 500 }}>{typeName}</div>
                    </button>
                  );
                })}
              </div>
            )}
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
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  color: '#E6E6E6',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => !uploading && (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => !uploading && (e.currentTarget.style.opacity = '0.7')}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
            </div>
            {uploading && (
              <p className="mt-2" style={{ color: '#2AB3EE', fontSize: '1rem' }}>Uploading files...</p>
            )}
            <p className="mt-2" style={{ color: '#E6E6E6', opacity: 0.7, fontSize: '1rem' }}>You can upload multiple files. Supported: Images, PDF, DOC, DOCX. Max 10MB per file.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 md:gap-4 pt-4 md:pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-3"
              style={{ 
                backgroundColor: '#2A2B30',
                fontSize: '1rem',
                padding: '14px 24px',
                minHeight: '56px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2022'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2A2B30'}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.dswId || !formData.clientId || !formData.typeOfProblem || !formData.description.trim()}
              className="w-full text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ 
                backgroundColor: loading ? '#2A2B30' : '#009200',
                fontSize: '1rem',
                padding: '14px 24px',
                minHeight: '56px',
              }}
              onMouseEnter={(e) => !loading && !(!formData.dswId || !formData.clientId || !formData.typeOfProblem || !formData.description.trim()) && (e.currentTarget.style.backgroundColor = '#007700')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#009200')}
            >
              {loading ? (
                <>
                  <Loader size="sm" color="#FFFFFF" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit
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




