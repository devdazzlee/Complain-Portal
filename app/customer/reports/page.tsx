'use client';

import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { exportToCSV, exportToExcel } from '../../utils/export';
import Loader from '../../components/Loader';

export default function ReportsPage() {
  const { getReportData, complaints } = useApp();
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generateReport = () => {
    setLoading(true);
    setTimeout(() => {
      const data = getReportData(dateRange.start && dateRange.end ? dateRange : undefined);
      setReportData(data);
      setLoading(false);
    }, 500);
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    setExporting(true);
    const exportData = complaints.map(c => ({
      'Complaint ID': c.complaintId,
      'Date Submitted': c.dateSubmitted,
      'Caretaker': c.caretaker,
      'Type': c.typeOfProblem,
      'Category': c.category || 'N/A',
      'Priority': c.priority,
      'Status': c.status,
      'Assigned To': c.assignedTo || 'N/A',
      'Description': c.description,
    }));
    exportToCSV(exportData, 'complaints_report');
    setTimeout(() => setExporting(false), 1000);
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    setExporting(true);
    const exportData = complaints.map(c => ({
      'Complaint ID': c.complaintId,
      'Date Submitted': c.dateSubmitted,
      'Caretaker': c.caretaker,
      'Type': c.typeOfProblem,
      'Category': c.category || 'N/A',
      'Priority': c.priority,
      'Status': c.status,
      'Assigned To': c.assignedTo || 'N/A',
      'Description': c.description,
    }));
    exportToExcel(exportData, 'complaints_report');
    setTimeout(() => setExporting(false), 1000);
  };

  return (
    <Layout role="customer">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6" style={{ color: '#E6E6E6' }}>
          Reports & Analytics
        </h1>

        {/* Date Range Filter */}
        <div className="rounded-lg p-4 md:p-6 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
          <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Filter by Date Range</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full rounded-lg outline-none"
                style={{
                  backgroundColor: '#1F2022',
                  border: '2px solid #E6E6E6',
                  color: '#E6E6E6',
                  fontSize: '1rem',
                  md: { fontSize: '1.125rem' },
                  padding: '14px 18px',
                  md: { padding: '16px 20px' },
                  minHeight: '52px',
                  md: { minHeight: '56px' },
                }}
              />
            </div>
            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full rounded-lg outline-none"
                style={{
                  backgroundColor: '#1F2022',
                  border: '2px solid #E6E6E6',
                  color: '#E6E6E6',
                  fontSize: '1rem',
                  md: { fontSize: '1.125rem' },
                  padding: '14px 18px',
                  md: { padding: '16px 20px' },
                  minHeight: '52px',
                  md: { minHeight: '56px' },
                }}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full sm:w-auto px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: loading ? '#2A2B30' : '#2AB3EE', color: '#E6E6E6', minHeight: '52px', md: { minHeight: '56px' } }}
            >
              {loading ? (
                <>
                  <Loader size="sm" color="#FFFFFF" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </button>
            {reportData && (
              <>
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="w-full sm:w-auto px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg whitespace-nowrap"
                  style={{ backgroundColor: exporting ? '#2A2B30' : '#009200', color: '#E6E6E6', minHeight: '52px', md: { minHeight: '56px' } }}
                >
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="w-full sm:w-auto px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg whitespace-nowrap"
                  style={{ backgroundColor: exporting ? '#2A2B30' : '#009200', color: '#E6E6E6', minHeight: '52px', md: { minHeight: '56px' } }}
                >
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Report Data */}
        {reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#2AB3EE' }}>
                <h3 className="text-base md:text-lg font-semibold mb-2" style={{ color: '#E6E6E6' }}>Total Complaints</h3>
                <p className="text-3xl md:text-4xl font-bold" style={{ color: '#E6E6E6' }}>{reportData.totalComplaints}</p>
              </div>
              <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#2A2B30' }}>
                <h3 className="text-base md:text-lg font-semibold mb-2" style={{ color: '#E6E6E6' }}>Avg Response Time</h3>
                <p className="text-3xl md:text-4xl font-bold" style={{ color: '#E6E6E6' }}>
                  {reportData.averageResponseTime.toFixed(1)}h
                </p>
              </div>
              <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#2A2B30' }}>
                <h3 className="text-base md:text-lg font-semibold mb-2" style={{ color: '#E6E6E6' }}>Avg Resolution Time</h3>
                <p className="text-3xl md:text-4xl font-bold" style={{ color: '#E6E6E6' }}>
                  {reportData.averageResolutionTime.toFixed(1)}h
                </p>
              </div>
              <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#009200' }}>
                <h3 className="text-base md:text-lg font-semibold mb-2" style={{ color: '#E6E6E6' }}>Resolved</h3>
                <p className="text-3xl md:text-4xl font-bold" style={{ color: '#E6E6E6' }}>
                  {reportData.complaintsByStatus.Closed || 0}
                </p>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#2A2B30' }}>
              <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Complaints by Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {Object.entries(reportData.complaintsByStatus).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#E6E6E6' }}>{count as number}</p>
                    <p className="text-sm md:text-lg break-words" style={{ color: '#E6E6E6', opacity: 0.8 }}>{status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#2A2B30' }}>
              <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Complaints by Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {Object.entries(reportData.complaintsByCategory).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#E6E6E6' }}>{count as number}</p>
                    <p className="text-sm md:text-lg break-words" style={{ color: '#E6E6E6', opacity: 0.8 }}>{category}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#2A2B30' }}>
              <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Complaints by Priority</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {Object.entries(reportData.complaintsByPriority).map(([priority, count]) => (
                  <div key={priority} className="text-center">
                    <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#E6E6E6' }}>{count as number}</p>
                    <p className="text-sm md:text-lg" style={{ color: '#E6E6E6', opacity: 0.8 }}>{priority}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!reportData && !loading && (
          <div className="text-center py-16">
            <p className="text-xl" style={{ color: '#E6E6E6', opacity: 0.7 }}>
              Select a date range and click "Generate Report" to view analytics
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

