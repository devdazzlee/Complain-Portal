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
import { ProblemType, Priority, ComplaintCategory, FileAttachment } from '../../../types';
import Loader from '../../../components/Loader';
import Toast from '../../../components/Toast';
import FileGallery from '../../../components/FileGallery';
import { VoiceRecognition } from '../../../utils/voiceRecognition';

const problemTypes: { type: ProblemType; icon: string; label: string }[] = [
  { type: 'Late arrival', icon: '🕐', label: 'Late arrival' },
  { type: 'Behavior', icon: '😞', label: 'Behavior' },
  { type: 'Missed service', icon: '💊', label: 'Missed service' },
  { type: 'Other', icon: '🏠', label: 'Other' },
];

export default function NewComplaintPage() {
  const router = useRouter();
  const { addComplaint, templates, getTemplateById, uploadFile } = useApp();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    caretaker: '',
    typeOfProblem: '' as ProblemType | '',
    category: '' as ComplaintCategory | '',
    priority: 'Medium' as Priority,
    description: '',
    tags: [] as string[],
    templateId: '',
  });
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const voiceRecognitionRef = useRef<VoiceRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    voiceRecognitionRef.current = new VoiceRecognition();
    return () => {
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stop();
      }
    };
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      setFormData({
        ...formData,
        templateId,
        typeOfProblem: template.typeOfProblem,
        category: template.category,
        priority: template.priority,
        description: template.description,
        tags: template.tags || [],
      });
      setToast({ message: 'Template loaded successfully', type: 'success' });
    }
  };

  const now = new Date();
  const complaintId = `CC-****-****`;
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.typeOfProblem || !formData.description.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    addComplaint({
      caretaker: formData.caretaker || 'Unknown',
      typeOfProblem: formData.typeOfProblem as ProblemType,
      category: formData.category || undefined,
      description: formData.description,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      templateId: formData.templateId || undefined,
    });

    setLoading(false);
    setToast({ message: 'Complaint submitted successfully!', type: 'success' });
    setTimeout(() => {
      router.push('/customer/dashboard');
    }, 1500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (max 10MB per file)
        if (file.size > 10 * 1024 * 1024) {
          setToast({ message: `File ${file.name} is too large (max 10MB)`, type: 'error' });
          continue;
        }

        // Validate file type
        const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.some(type => file.type.startsWith(type))) {
          setToast({ message: `File ${file.name} type not supported`, type: 'error' });
          continue;
        }

        const uploaded = await uploadFile(file);
        setAttachments(prev => [...prev, uploaded]);
      }
    } catch {
      setToast({ message: 'Error uploading file', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
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
    <Layout role="customer">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3" style={{ color: '#E6E6E6' }}>Tell us what happened</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6 md:mb-8 text-base md:text-lg" style={{ color: '#E6E6E6', opacity: 0.8 }}>
          <span>Complaint ID: {complaintId}</span>
          <span className="hidden sm:inline">|</span>
          <span>Date: {dateStr}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          {templates.length > 0 && (
            <div>
              <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>
                Use Template (Optional)
              </label>
              <Select value={formData.templateId} onValueChange={(value) => handleTemplateSelect(value)}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id} className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Caretaker */}
          <div>
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Caretaker</label>
            <Select value={formData.caretaker || undefined} onValueChange={(value) => setFormData({ ...formData, caretaker: value })}>
              <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                <SelectValue placeholder="Select caretaker (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                <SelectItem value="Lisa Adams" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Lisa Adams</SelectItem>
                <SelectItem value="John Smith" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">John Smith</SelectItem>
                <SelectItem value="Sarah Reed" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Sarah Reed</SelectItem>
                <SelectItem value="Michael Brown" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Michael Brown</SelectItem>
                <SelectItem value="Emily Johnson" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Emily Johnson</SelectItem>
                <SelectItem value="Unknown" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2" style={{ color: '#E6E6E6', opacity: 0.7, fontSize: '1rem' }}>If you&apos;re not sure, you can leave this empty</p>
          </div>

          {/* Type of Problem */}
          <div>
            <label className="block mb-4" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Choose one of the options</label>
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
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Describe What Happened</label>
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
            <label className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>Attach Files (Optional)</label>
            {attachments.length > 0 && (
              <div className="mb-4">
                <FileGallery
                  files={attachments}
                  onDelete={removeAttachment}
                  canDelete={true}
                />
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
              disabled={loading || !formData.typeOfProblem || !formData.description.trim()}
              className="w-full text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ 
                backgroundColor: loading ? '#2A2B30' : '#009200',
                fontSize: '1rem',
                padding: '14px 24px',
                minHeight: '56px',
              }}
              onMouseEnter={(e) => !loading && !(!formData.typeOfProblem || !formData.description.trim()) && (e.currentTarget.style.backgroundColor = '#007700')}
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

