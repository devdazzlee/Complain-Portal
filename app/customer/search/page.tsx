'use client';

import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintStatus, Priority, ComplaintCategory } from '../../types';
import PriorityBadge from '../../components/PriorityBadge';
import { exportToCSV, exportToExcel } from '../../utils/export';

export default function AdvancedSearchPage() {
  const { complaints, filterComplaints, currentUser } = useApp();
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: [] as ComplaintStatus[],
    priority: [] as Priority[],
    category: [] as ComplaintCategory[],
    assignedTo: '',
    dateRange: {
      start: '',
      end: '',
    },
    tags: [] as string[],
  });
  const [results, setResults] = useState<Complaint[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSearch = () => {
    const filtered = filterComplaints(filters);
    setResults(filtered);
  };

  const handleExportCSV = () => {
    setExporting(true);
    exportToCSV(results, 'complaints_search_results');
    setTimeout(() => setExporting(false), 1000);
  };

  const handleExportExcel = () => {
    setExporting(true);
    exportToExcel(results, 'complaints_search_results');
    setTimeout(() => setExporting(false), 1000);
  };

  const toggleStatus = (status: ComplaintStatus) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  };

  const togglePriority = (priority: Priority) => {
    setFilters(prev => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...prev.priority, priority],
    }));
  };

  const toggleCategory = (category: ComplaintCategory) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category],
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      status: [],
      priority: [],
      category: [],
      assignedTo: '',
      dateRange: { start: '', end: '' },
      tags: [],
    });
    setResults([]);
  };

  return (
    <Layout role="customer">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6" style={{ color: '#E6E6E6' }}>
          Advanced Search
        </h1>

        {/* Search Bar */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by complaint ID, caretaker, description..."
              className="flex-1 rounded-lg outline-none transition"
              style={{
                backgroundColor: '#1F2022',
                border: '2px solid #E6E6E6',
                color: '#E6E6E6',
                fontSize: '1rem',
                padding: '14px 18px',
                minHeight: '52px',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
              onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="flex gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={handleSearch}
                className="flex-1 sm:flex-none px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg whitespace-nowrap"
                style={{ backgroundColor: '#2AB3EE', color: '#E6E6E6', minHeight: '52px' }}
              >
                Search
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-none px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg whitespace-nowrap"
                style={{ backgroundColor: '#2A2B30', color: '#E6E6E6', border: '2px solid #E6E6E6', minHeight: '52px' }}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="rounded-lg p-4 md:p-6 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
            <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Filters</h2>
            
            {/* Status Filter */}
            <div className="mb-4">
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Status</label>
              <div className="flex flex-wrap gap-2">
                {(['Open', 'In Progress', 'Closed', 'Refused'] as ComplaintStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                      backgroundColor: filters.status.includes(status) ? '#2AB3EE' : '#1F2022',
                      color: '#E6E6E6',
                      border: '2px solid #E6E6E6',
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="mb-4">
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Priority</label>
              <div className="flex flex-wrap gap-2">
                {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map(priority => (
                  <button
                    key={priority}
                    onClick={() => togglePriority(priority)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                      backgroundColor: filters.priority.includes(priority) ? '#2AB3EE' : '#1F2022',
                      color: '#E6E6E6',
                      border: '2px solid #E6E6E6',
                    }}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Category</label>
              <div className="flex flex-wrap gap-2">
                {(['Service Quality', 'Staff Behavior', 'Timing Issues', 'Safety Concerns', 'Billing', 'Other'] as ComplaintCategory[]).map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                      backgroundColor: filters.category.includes(category) ? '#2AB3EE' : '#1F2022',
                      color: '#E6E6E6',
                      border: '2px solid #E6E6E6',
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Start Date</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })}
                  className="w-full rounded-lg outline-none"
                  style={{
                    backgroundColor: '#1F2022',
                    border: '2px solid #E6E6E6',
                    color: '#E6E6E6',
                    fontSize: '1rem',
                    padding: '14px 18px',
                    minHeight: '52px',
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>End Date</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } })}
                  className="w-full rounded-lg outline-none"
                  style={{
                    backgroundColor: '#1F2022',
                    border: '2px solid #E6E6E6',
                    color: '#E6E6E6',
                    fontSize: '1rem',
                    padding: '14px 18px',
                    minHeight: '52px',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-4 md:px-6 py-3 rounded-lg font-semibold text-base md:text-lg"
                style={{ backgroundColor: '#2A2B30', color: '#E6E6E6', border: '2px solid #E6E6E6', minHeight: '52px' }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-base md:text-lg" style={{ color: '#E6E6E6' }}>
              Found {results.length} complaint(s)
            </p>
            <div className="flex gap-2 md:gap-4">
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap"
                style={{ backgroundColor: exporting ? '#2A2B30' : '#009200', color: '#E6E6E6', minHeight: '44px' }}
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap"
                style={{ backgroundColor: exporting ? '#2A2B30' : '#009200', color: '#E6E6E6', minHeight: '44px' }}
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                {filters.searchQuery || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v) 
                  ? 'No complaints found matching your criteria'
                  : 'Enter search criteria and click Search'}
              </p>
            </div>
          ) : (
            results.map(complaint => (
              <div
                key={complaint.id}
                className="rounded-lg p-4 md:p-6 cursor-pointer transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: '#2A2B30', border: '2px solid #E6E6E6' }}
                onClick={() => window.location.href = `/customer/complaints/${complaint.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 md:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold mb-2 break-words" style={{ color: '#E6E6E6' }}>
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
                  <span>Status: {complaint.status}</span>
                  <span>Date: {complaint.dateSubmitted}</span>
                  {complaint.category && <span>Category: {complaint.category}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

