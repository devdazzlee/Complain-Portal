import { create } from 'zustand';

interface ReportData {
  totalComplaints: number;
  resolved: number;
  avgResponse: number;
  avgResolution: number;
  complaintsByStatus: Record<string, number>;
  complaintsByCategory: Record<string, number>;
  complaintsByPriority: Record<string, number>;
}

interface ReportsState {
  reportData: ReportData | null;
  lastFetched: number | null;
  setReportData: (data: ReportData) => void;
  clearAll: () => void;
  isStale: () => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useReportsStore = create<ReportsState>((set, get) => ({
  reportData: null,
  lastFetched: null,

  setReportData: (data: ReportData) => {
    set({ reportData: data, lastFetched: Date.now() });
  },

  clearAll: () => {
    set({
      reportData: null,
      lastFetched: null,
    });
  },

  isStale: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    return Date.now() - lastFetched > CACHE_DURATION;
  },
}));



