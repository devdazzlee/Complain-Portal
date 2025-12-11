'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { Complaint } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { complaints, currentUser } = useApp();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = complaints.filter(c => 
        c.complaintId.toLowerCase().includes(query) ||
        c.caretaker.toLowerCase().includes(query) ||
        c.typeOfProblem.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.status.toLowerCase().includes(query)
      );
      setFilteredComplaints(filtered);
    } else {
      setFilteredComplaints([]);
    }
  }, [searchQuery, complaints]);

  const handleComplaintClick = (id: string) => {
    // Determine the correct route based on user role
    const role = currentUser?.role || 'provider';
    if (role === 'admin') {
      router.push(`/admin/complaints/${id}`);
    } else {
      router.push(`/provider/complaints/${id}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-lg shadow-2xl bg-[#2A2B30] border-2 border-[#E6E6E6]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints by ID, caretaker, type, or description..."
              autoFocus
              className="w-full rounded-lg outline-none transition placeholder:opacity-50 border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg pr-5 py-4 min-h-[56px] focus:border-[#2AB3EE]"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                paddingLeft: '52px'
              }}
            />
            
          </div>

          {searchQuery && (
            <div className="max-h-96 overflow-y-auto">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>No complaints found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      onClick={() => handleComplaintClick(complaint.id)}
                      className="p-4 rounded-lg cursor-pointer transition-colors"
                      style={{ backgroundColor: '#1F2022' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A2B30'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F2022'}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold mb-1" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>
                            {complaint.complaintId}
                          </p>
                          <p style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.8 }}>
                            {complaint.caretaker} • {complaint.typeOfProblem}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-semibold"
                          style={{ 
                            backgroundColor: complaint.status === 'In Progress' ? '#2AB3EE' : 
                                           complaint.status === 'Refused' ? '#FF3F3F' : 
                                           complaint.status === 'Closed' ? '#009200' : '#2AB3EE',
                            color: '#FFFFFF',
                            fontSize: '0.875rem'
                          }}
                        >
                          {complaint.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
