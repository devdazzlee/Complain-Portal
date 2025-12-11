'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../components/Layout';
import { useApp } from '../../../context/AppContext';
import { generatePDF } from '../../../utils/pdfExport';
import Loader from '../../../components/Loader';
import Toast from '../../../components/Toast';
import CommentsSection from '../../../components/CommentsSection';
import FileGallery from '../../../components/FileGallery';
import PriorityBadge from '../../../components/PriorityBadge';

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getComplaintById, deleteComplaint } = useApp();
  const complaint = getComplaintById(params.id as string);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!complaint) {
    return (
      <Layout role="provider">
        <div className="text-center py-16">
          <p style={{ color: '#E6E6E6', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Complaint not found</p>
          <button
            onClick={() => router.push('/provider/dashboard')}
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

  const isRefused = complaint.status === 'Refused';
  const isInProgress = complaint.status === 'In Progress';
  const statusColor = isRefused ? 'text-red-400' : isInProgress ? 'text-yellow-400' : 'text-gray-400';

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    deleteComplaint(complaint.id);
    setDeleting(false);
    setToast({ message: 'Complaint deleted successfully', type: 'success' });
    setTimeout(() => {
      router.push('/provider/dashboard');
    }, 1500);
  };

  return (
    <Layout role="provider">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 break-words" style={{ color: '#E6E6E6' }}>
            <span className="block md:inline">Complaint #{complaint.complaintId}</span>
            {isRefused && (
              <span className="block md:inline md:ml-2 mt-2 md:mt-0">
                <span className="md:mr-2">|</span> Status: <span style={{ color: '#FF3F3F' }}>Refused</span>
              </span>
            )}
            {isInProgress && (
              <span className="block md:inline md:ml-2 mt-2 md:mt-0">
                <span className="md:mr-2">|</span> Status: <span style={{ color: '#2AB3EE' }}>In Progress</span>
              </span>
            )}
          </h1>
          {isRefused ? (
            <p className="text-base md:text-xl" style={{ color: '#E6E6E6', opacity: 0.8 }}>Your complaint has been refused by the supervisor.</p>
          ) : isInProgress ? (
            <p className="text-base md:text-xl" style={{ color: '#E6E6E6', opacity: 0.8 }}>We're reviewing your concern. You'll be notified when it's resolved.</p>
          ) : (
            <p className="text-base md:text-xl" style={{ color: '#E6E6E6', opacity: 0.8 }}>Complaint details and status updates.</p>
          )}
        </div>

        {/* Priority and Status Badge */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-6">
          <PriorityBadge priority={complaint.priority} size="lg" />
          {complaint.category && (
            <span className="px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap" style={{ backgroundColor: '#2AB3EE', color: '#E6E6E6' }}>
              {complaint.category}
            </span>
          )}
          {complaint.assignedTo && (
            <span className="px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap" style={{ backgroundColor: '#2A2B30', color: '#E6E6E6', border: '2px solid #E6E6E6' }}>
              <span className="hidden sm:inline">Assigned to: </span>{complaint.assignedTo}
            </span>
          )}
        </div>

        {/* Tags */}
        {complaint.tags && complaint.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {complaint.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: '#2AB3EE', color: '#E6E6E6' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Complaint Details Table */}
        <div className="rounded-lg p-4 md:p-6 lg:p-8 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6" style={{ color: '#E6E6E6' }}>Complaint Details</h2>
          
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#1F2022', border: '2px solid #E6E6E6' }}>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.7 }}>Date Submitted</p>
                  <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.dateSubmitted}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.7 }}>Caretaker</p>
                  <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.caretaker}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.7 }}>Type of Problem</p>
                  <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.typeOfProblem}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.7 }}>Description</p>
                  <p style={{ color: '#E6E6E6', fontSize: '1.125rem', wordBreak: 'break-word' }}>{complaint.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottomColor: '#E6E6E6', borderWidth: '2px' }} className="border-b">
                  <th className="text-left py-4 px-4 font-semibold whitespace-nowrap" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Date Submitted</th>
                  <th className="text-left py-4 px-4 font-semibold whitespace-nowrap" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Caretaker</th>
                  <th className="text-left py-4 px-4 font-semibold whitespace-nowrap" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Type of Problem</th>
                  <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-5 px-4 whitespace-nowrap" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.dateSubmitted}</td>
                  <td className="py-5 px-4 whitespace-nowrap" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.caretaker}</td>
                  <td className="py-5 px-4 whitespace-nowrap" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.typeOfProblem}</td>
                  <td className="py-5 px-4" style={{ color: '#E6E6E6', fontSize: '1.125rem', wordBreak: 'break-word' }}>{complaint.description}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Attachments */}
        {complaint.attachments && complaint.attachments.length > 0 && (
          <div className="rounded-lg p-6 md:p-8 mb-6" style={{ backgroundColor: '#2A2B30' }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#E6E6E6' }}>Attachments</h2>
            <FileGallery files={complaint.attachments} />
          </div>
        )}

        {/* Refusal Reasons */}
        {isRefused && complaint.refusalReasons && (
          <div className="rounded-lg p-6 md:p-8 mb-6" style={{ backgroundColor: '#2A2B30' }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#E6E6E6' }}>Reasons why your complaint got refused:</h2>
            <ul className="space-y-3">
              {complaint.refusalReasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', lineHeight: '1.7' }}>
                  <span style={{ color: '#FF3F3F', fontSize: '1.5rem', marginTop: '2px' }}>•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Complaint Status Timeline */}
        <div className="rounded-lg p-4 md:p-6 lg:p-8 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 md:mb-8" style={{ color: '#E6E6E6' }}>Complaint Status</h2>
          <div className="space-y-4 md:space-y-5">
            {complaint.timeline.map((item, index) => (
              <div key={index} className="flex items-start gap-3 md:gap-5">
                <div className={`shrink-0 rounded-full flex items-center justify-center w-10 h-10 md:w-12 md:h-12`}
                  style={{
                    backgroundColor: item.isRefused 
                      ? '#FF3F3F' 
                      : item.isCompleted 
                      ? '#009200' 
                      : '#2A2B30'
                  }}
                >
                  {item.isRefused ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-2 break-words text-base md:text-xl" style={{ color: '#E6E6E6' }}>{item.date}: {item.status}</div>
                  <div className="break-words text-base md:text-lg" style={{ color: '#E6E6E6', opacity: 0.8, lineHeight: '1.6' }}>{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Summary */}
        {complaint.complianceSummary && (
          <div className="rounded-lg p-4 md:p-6 lg:p-8 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6" style={{ color: '#E6E6E6' }}>
              <span className="block md:inline">Compliance Summary</span>
              <span className="block md:inline md:ml-2">
                <span className="hidden md:inline">| </span>
                <span style={{ color: isRefused ? '#FF3F3F' : isInProgress ? '#2AB3EE' : '#009200' }}>
                  {complaint.complianceSummary.closedOn}
                </span>
              </span>
            </h2>
            {/* Mobile Card View */}
            <div className="md:hidden mb-6 space-y-3">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#1F2022', border: '2px solid #E6E6E6' }}>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.7 }}>Date Submitted</p>
                    <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.complianceSummary.dateSubmitted}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.7 }}>Acknowledged By</p>
                    <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.complianceSummary.acknowledgedBy}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.7 }}>Investigated On</p>
                    <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.complianceSummary.investigatedOn}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#E6E6E6', fontSize: '1rem', opacity: 0.7 }}>Closed On</p>
                    <p style={{ 
                      color: isRefused ? '#FF3F3F' : isInProgress ? '#2AB3EE' : '#009200',
                      fontSize: '1.125rem',
                      fontWeight: 600
                    }}>
                      {complaint.complianceSummary.closedOn}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottomColor: '#E6E6E6', borderWidth: '2px' }} className="border-b">
                    <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Date Submitted</th>
                    <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Acknowledged By</th>
                    <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Investigated On</th>
                    <th className="text-left py-4 px-4 font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Closed On</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-5 px-4" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.complianceSummary.dateSubmitted}</td>
                    <td className="py-5 px-4" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.complianceSummary.acknowledgedBy}</td>
                    <td className="py-5 px-4" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{complaint.complianceSummary.investigatedOn}</td>
                    <td className="py-5 px-4" style={{ 
                      color: isRefused ? '#FF3F3F' : isInProgress ? '#2AB3EE' : '#009200',
                      fontSize: '1.125rem',
                      fontWeight: 600
                    }}>
                      {complaint.complianceSummary.closedOn}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {complaint.complianceSummary.notes && (
              <p style={{ color: '#E6E6E6', fontSize: '1.125rem', marginTop: '1rem', lineHeight: '1.7', opacity: 0.9 }}>{complaint.complianceSummary.notes}</p>
            )}
            {complaint.resolutionSummary && (
              <p style={{ color: '#E6E6E6', fontSize: '1.125rem', marginTop: '1rem', lineHeight: '1.7', opacity: 0.9 }}>{complaint.resolutionSummary}</p>
            )}
          </div>
        )}

        {/* Compliance Statement */}
        {complaint.complianceStatement && (
          <div className="rounded-lg p-6 md:p-8 mb-6" style={{ backgroundColor: '#2A2B30' }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Compliance Statement:</h2>
            <div className="flex items-start gap-4">
              <svg className="w-8 h-8 shrink-0 mt-1" style={{ color: '#009200' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <p style={{ color: '#E6E6E6', fontSize: '1.125rem', lineHeight: '1.7' }}>{complaint.complianceStatement}</p>
            </div>
          </div>
        )}

        {/* Rating and Feedback */}
        {complaint.rating && (
          <div className="rounded-lg p-6 md:p-8 mb-6" style={{ backgroundColor: '#2A2B30' }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Your Rating</h2>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} style={{ fontSize: '2rem', color: star <= complaint.rating! ? '#FFD700' : '#E6E6E6', opacity: star <= complaint.rating! ? 1 : 0.3 }}>
                  ★
                </span>
              ))}
              <span className="ml-2 text-lg" style={{ color: '#E6E6E6' }}>{complaint.rating}/5</span>
            </div>
            {complaint.feedback && (
              <p style={{ color: '#E6E6E6', fontSize: '1.125rem', lineHeight: '1.7' }}>{complaint.feedback}</p>
            )}
          </div>
        )}

        {/* Comments Section */}
        <CommentsSection complaintId={complaint.id} />

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 md:gap-4 pt-4">
          <button
            onClick={async () => {
              setExportingPDF(true);
              try {
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
                generatePDF({
                  complaintId: complaint.complaintId,
                  dateSubmitted: complaint.dateSubmitted,
                  caretaker: complaint.caretaker,
                  typeOfProblem: complaint.typeOfProblem,
                  description: complaint.description,
                  status: complaint.status,
                  timeline: complaint.timeline,
                  complianceSummary: complaint.complianceSummary,
                  complianceStatement: complaint.complianceStatement,
                });
              } catch (error) {
                // Error handling - PDF generation will show browser print dialog
                console.error('PDF generation error:', error);
              } finally {
                setExportingPDF(false);
              }
            }}
            disabled={exportingPDF}
            className="w-full md:w-auto text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg px-6 md:px-7 py-3.5 md:py-4"
            style={{ 
              backgroundColor: exportingPDF ? '#2A2B30' : '#2AB3EE',
              minHeight: '56px',
            }}
            onMouseEnter={(e) => !exportingPDF && (e.currentTarget.style.backgroundColor = '#1F8FD0')}
            onMouseLeave={(e) => !exportingPDF && (e.currentTarget.style.backgroundColor = '#2AB3EE')}
          >
            {exportingPDF ? (
              <>
                <Loader size="sm" color="#FFFFFF" />
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Compliance PDF
              </>
            )}
          </button>
          {complaint.status === 'Open' && (
            <button
              onClick={() => router.push(`/provider/complaints/${complaint.id}/edit`)}
              className="w-full md:w-auto text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 text-base md:text-lg px-6 md:px-7 py-3.5 md:py-4"
              style={{ 
                backgroundColor: '#009200',
                minHeight: '56px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#007700'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009200'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Complaint
            </button>
          )}
          {complaint.status === 'Open' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="w-full md:w-auto text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg px-6 md:px-7 py-3.5 md:py-4"
              style={{ 
                backgroundColor: deleting ? '#2A2B30' : '#FF3F3F',
                minHeight: '56px',
              }}
              onMouseEnter={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#CD0000')}
              onMouseLeave={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#FF3F3F')}
            >
              {deleting ? (
                <>
                  <Loader size="sm" color="#FFFFFF" />
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </>
              )}
            </button>
          )}
          <button
            onClick={() => router.push('/provider/dashboard')}
            className="w-full md:w-auto text-white rounded-lg font-semibold transition-colors border text-base md:text-lg px-6 md:px-7 py-3.5 md:py-4"
            style={{ 
              backgroundColor: '#2A2B30', 
              borderColor: '#E6E6E6',
              borderWidth: '2px',
              minHeight: '56px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F2022';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2A2B30';
            }}
          >
            Back To Dashboard
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowDeleteConfirm(false)}>
            <div className="rounded-lg p-6 max-w-md w-full bg-[#2A2B30] border-2 border-[#E6E6E6]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold mb-4 text-[#E6E6E6]">Delete Complaint?</h3>
              <p className="mb-6 text-[#E6E6E6] text-lg leading-relaxed">
                Are you sure you want to delete complaint {complaint.complaintId}? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-white rounded-lg font-semibold transition-colors bg-[#2A2B30] text-lg px-6 py-3.5 min-h-[56px] border-2 border-[#E6E6E6] hover:bg-[#1F2022]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`flex-1 text-white rounded-lg font-semibold transition-colors text-lg px-6 py-3.5 min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed ${
                    deleting ? 'bg-[#2A2B30]' : 'bg-[#FF3F3F] hover:bg-[#CD0000]'
                  }`}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

