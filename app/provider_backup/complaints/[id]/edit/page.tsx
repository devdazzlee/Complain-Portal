'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/Layout';
import { useApp } from '../../../../context/AppContext';
import { ProblemType } from '../../../../types';
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

export default function EditComplaintPage() {
  const params = useParams();
  const router = useRouter();
  const { getComplaintById, updateComplaint } = useApp();
  const complaint = getComplaintById(params.id as string);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    caretaker: '',
    typeOfProblem: '' as ProblemType | '',
    description: '',
    photo: '',
  });

  useEffect(() => {
    if (complaint) {
      setFormData({
        caretaker: complaint.caretaker,
        typeOfProblem: complaint.typeOfProblem,
        description: complaint.description,
        photo: complaint.photo || '',
      });
    }
  }, [complaint]);

  if (!complaint) {
    return (
      <Layout role="customer">
        <div className="text-center py-16">
          <p style={{ color: '#E6E6E6', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Complaint not found</p>
          <button
            onClick={() => router.push('/customer/dashboard')}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.typeOfProblem || !formData.description.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateComplaint(complaint.id, {
      caretaker: formData.caretaker || 'Unknown',
      typeOfProblem: formData.typeOfProblem as ProblemType,
      description: formData.description,
      photo: formData.photo || undefined,
    });

    setLoading(false);
    setToast({ message: 'Complaint updated successfully!', type: 'success' });
    setTimeout(() => {
      router.push(`/customer/complaints/${complaint.id}`);
    }, 1500);
  };

  return (
    <Layout role="customer">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: '#E6E6E6' }}>Edit Complaint</h1>
        <div className="flex items-center gap-4 mb-8" style={{ color: '#E6E6E6', opacity: 0.8, fontSize: '1.125rem' }}>
          <span>Complaint ID: {complaint.complaintId}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="relative">
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
              disabled={loading || !formData.typeOfProblem || !formData.description.trim()}
              className="flex-1 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ 
                backgroundColor: loading ? '#2A2B30' : '#009200',
                fontSize: '1.125rem',
                padding: '16px 28px',
                minHeight: '60px'
              }}
              onMouseEnter={(e) => !loading && !(!formData.typeOfProblem || !formData.description.trim()) && (e.currentTarget.style.backgroundColor = '#007700')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#009200')}
            >
              {loading ? (
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

