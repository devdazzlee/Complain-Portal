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
import { ProblemType, Priority, ComplaintCategory, FileAttachment, ComplaintStatus } from '../../../types';
import Loader from '../../../components/Loader';
import Toast from '../../../components/Toast';
import FileGallery from '../../../components/FileGallery';
import { VoiceRecognition } from '../../../utils/voiceRecognition';
import { useDashboardStore } from '../../../../lib/stores/dashboardStore';
import { useDsws, useClients, useTypes, usePriorities, useAddType, useComplaintStatuses } from '../../../../lib/hooks';

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
    typeOfProblem: '' as string | '',
    category: '' as ComplaintCategory | '',
    priority: 'Low' as Priority,
    status: '' as string, // Store status ID as string
    description: '',
    remarks: '',
    tags: [] as string[],
  });
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dswSearch, setDswSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const voiceRecognitionRef = useRef<VoiceRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use React Query hooks for non-blocking data fetching
  const { data: dsws = [], isLoading: dswsLoading, error: dswsError } = useDsws();
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useClients();
  const { data: types = [], isLoading: typesLoading, error: typesError } = useTypes();
  const { data: priorities = [], isLoading: prioritiesLoading, error: prioritiesError } = usePriorities();
  const { data: statuses = [], isLoading: statusesLoading, error: statusesError } = useComplaintStatuses();
  const addTypeMutation = useAddType();
  
  // State for custom type modal
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [addingType, setAddingType] = useState(false);

  // Show toast if any data fails to load (non-blocking)
  useEffect(() => {
    if (dswsError || clientsError || typesError || prioritiesError || statusesError) {
      const errors = [dswsError, clientsError, typesError, prioritiesError, statusesError].filter(Boolean);
      if (errors.length > 0) {
        setToast({ 
          message: 'Some form data failed to load. You can still submit the form.', 
          type: 'info' 
        });
      }
    }
  }, [dswsError, clientsError, typesError, prioritiesError, statusesError]);

  // Filter DSWs and Clients based on search (using React Query data)
  const filteredDsws = dsws.filter(dsw =>
    dsw.name.toLowerCase().includes(dswSearch.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Get status ID from formData (which now stores status ID as string)
  const getStatusId = (statusIdOrName: string): number | undefined => {
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
    console.log('Looking for priority:', priorityName);
    console.log('Available priorities:', priorities);
    const priority = priorities.find((p: Record<string, unknown>) => 
      (p.label as string)?.toLowerCase() === priorityName.toLowerCase() || 
      (p.code as string)?.toLowerCase() === priorityName.toLowerCase() ||
      (p.name as string)?.toLowerCase() === priorityName.toLowerCase()
    );
    console.log('Found priority:', priority);
    return priority?.id as number | undefined;
  };

  // Handle adding custom type
  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      setToast({ message: 'Please enter a type name', type: 'error' });
      return;
    }

    setAddingType(true);
    try {
      await addTypeMutation.mutateAsync(newTypeName.trim());
      setToast({ message: 'Type added successfully!', type: 'success' });
      setShowAddTypeModal(false);
      setNewTypeName('');
    } catch (error: any) {
      setToast({ 
        message: error?.response?.data?.message || error?.message || 'Failed to add type', 
        type: 'error' 
      });
    } finally {
      setAddingType(false);
    }
  };


  useEffect(() => {
    voiceRecognitionRef.current = new VoiceRecognition();
    return () => {
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stop();
      }
    };
  }, []);


  const now = new Date();
  const complaintId = `CC-****-****`;
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dswId || !formData.clientId || !formData.typeOfProblem || !formData.description.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    const typeId = getTypeId(formData.typeOfProblem);
    const priorityId = getPriorityId(formData.priority);
    const statusId = getStatusId(formData.status);

    if (!typeId || !priorityId) {
      setToast({ message: 'Invalid type or priority selected', type: 'error' });
      return;
    }
    
    // If no status selected, default to first status (usually "Open")
    const finalStatusId = statusId || (statuses.length > 0 ? String(statuses[0]?.id || statuses[0]?.status_id || '1') : '1');

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('dsw_id', formData.dswId);
      formDataToSend.append('client_id', formData.clientId);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('case_start_by', String(currentUser?.id || ''));
      formDataToSend.append('status_id', String(finalStatusId));
      formDataToSend.append('priority_id', String(priorityId));
      formDataToSend.append('type_id', String(typeId));
      formDataToSend.append('remarks', formData.remarks || `Complaint created by ${currentUser?.name || 'provider'}`);

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
          router.push('/provider/complaints');
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
        const allowedTypes = [
          'image/', 
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg', // Explicitly support JPEG
          'image/jpg',  // Explicitly support JPG  
          'image/jpe',  // Explicitly support JPE
          'image/png',  // Explicitly support PNG
          'image/gif',  // Explicitly support GIF
          'image/webp' // Explicitly support WebP
        ];
        console.log('File details:', fileArray.map(f => ({ name: f.name, type: f.type, size: f.size })));
        console.log('Allowed types:', allowedTypes);
    const invalidTypes = fileArray.filter(file => !allowedTypes.some(type => file.type.startsWith(type) || file.type === type));
    if (invalidTypes.length > 0) {
      console.log('Invalid files:', invalidTypes);
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

  return (
    <Layout role="provider">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3" style={{ color: '#E6E6E6' }}>Tell us what happened</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8 text-sm sm:text-base md:text-lg" style={{ color: '#E6E6E6', opacity: 0.8 }}>
          <span>Date: {dateStr}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* DSW Selection */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>DSW (Direct Service Worker) *</label>
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
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>Client *</label>
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
                {clientsLoading ? (
                  <div className="px-3 py-4 text-center" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                    Loading clients...
                  </div>
                ) : filteredClients.length > 0 ? (
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
                    {clientSearch ? `No clients found matching "${clientSearch}"` : 'No clients available'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Type of Problem */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Choose one of the options</label>
              <button
                type="button"
                onClick={() => setShowAddTypeModal(true)}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: '#2AB3EE', 
                  color: '#E6E6E6',
                  border: '1px solid #2AB3EE'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a9bd4'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2AB3EE'}
              >
                + Add Custom Type
              </button>
            </div>
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
                  // Compare by type ID instead of mapped name
                  const isSelected = formData.typeOfProblem === typeId;
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

          {/* Add Custom Type Modal */}
          {showAddTypeModal && (
            <div 
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onClick={() => !addingType && setShowAddTypeModal(false)}
            >
              <div 
                className="rounded-lg p-6 md:p-8 max-w-md w-full mx-4"
                style={{ backgroundColor: '#2A2B30', border: '2px solid #E6E6E6' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Add Custom Type</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2" style={{ color: '#E6E6E6', fontSize: '1rem', fontWeight: 500 }}>
                      Type Name
                    </label>
                    <input
                      type="text"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="Enter type name"
                      className="w-full rounded-lg p-3"
                      style={{
                        backgroundColor: '#1F2022',
                        border: '2px solid #E6E6E6',
                        color: '#E6E6E6',
                        fontSize: '1rem',
                      }}
                      disabled={addingType}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTypeName.trim() && !addingType) {
                          handleAddType();
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTypeModal(false);
                        setNewTypeName('');
                      }}
                      disabled={addingType}
                      className="px-4 py-2 rounded font-semibold transition-colors"
                      style={{
                        backgroundColor: '#2A2B30',
                        color: '#E6E6E6',
                        border: '2px solid #E6E6E6',
                        opacity: addingType ? 0.5 : 1,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddType}
                      disabled={!newTypeName.trim() || addingType}
                      className="px-4 py-2 rounded font-semibold transition-colors"
                      style={{
                        backgroundColor: (!newTypeName.trim() || addingType) ? '#2A2B30' : '#2AB3EE',
                        color: '#E6E6E6',
                        opacity: (!newTypeName.trim() || addingType) ? 0.5 : 1,
                      }}
                    >
                      {addingType ? 'Adding...' : 'Add Type'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Priority Selection */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>Priority *</label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus-visible:!ring-0 focus-visible:ring-offset-0 data-[state=open]:!ring-0 data-[state=open]:shadow-none">
                <SelectValue placeholder="Select priority..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] max-h-80">
                {priorities.length > 0 ? (
                  priorities.map((priority: any) => (
                    <SelectItem 
                      key={String(priority.id)} 
                      value={String(priority.label || priority.code || priority.name)}
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
                      {String(priority.label || priority.code || priority.name)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-priorities" disabled className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                    No priorities available
                  </SelectItem>
                )}
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
                  <SelectItem value="1" className="focus:bg-[#2A2B30]">Open</SelectItem>
                )}
              </SelectContent>
            </Select>
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

          {/* File Upload */}
          <div>
            <label className="block mb-2 sm:mb-3 text-base sm:text-lg" style={{ color: '#E6E6E6', fontWeight: 500 }}>Attach Files (Optional)</label>
            {attachments.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {attachments.map((file, index) => (
                    <div key={index} className="relative rounded-lg p-3 hover:bg-opacity-80 transition-all" style={{ backgroundColor: '#2A2B30', border: '1px solid #4A4B50' }}>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 p-1 hover:opacity-70 transition-opacity z-10"
                        style={{ color: '#FFFFFF' }}
                        aria-label="Remove file"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="flex items-start justify-between mb-2 pr-6">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate font-medium" style={{ color: '#E6E6E6' }} title={file.name}>{file.name}</p>
                          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex items-center text-xs" style={{ color: '#6B7280' }}>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {file.type || 'File'}
                      </div>
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

          {/* Info Box */}
          <div className="rounded-lg p-5" style={{ backgroundColor: '#2A2B30', borderColor: '#009200', borderWidth: '2px', borderStyle: 'solid' }}>
            <p style={{ color: '#009200', fontSize: '1.125rem', lineHeight: '1.7' }}>
              Our staff will review your concern within 2-3 working days. You&apos;ll see the status update on your dashboard.
            </p>
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

