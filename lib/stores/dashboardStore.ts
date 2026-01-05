import { create } from 'zustand';
import { Complaint, DashboardStats } from '../../app/types';

interface DashboardState {
  // Stats
  stats: DashboardStats | null;
  statsLastFetched: number | null;
  
  // Complaints
  complaints: Complaint[];
  complaintsLastFetched: number | null;
  
  // Metadata
  statuses: Array<Record<string, unknown>>;
  types: Array<Record<string, unknown>>;
  users: Array<Record<string, unknown>>;
  metadataLastFetched: number | null;
  
  // Stats response data (for admin user counts)
  statsResponseData: Record<string, unknown> | null;
  
  // Actions
  setStats: (stats: DashboardStats, responseData?: Record<string, unknown>) => void;
  setComplaints: (complaints: Complaint[]) => void;
  setStatuses: (statuses: Array<Record<string, unknown>>) => void;
  setTypes: (types: Array<Record<string, unknown>>) => void;
  setUsers: (users: Array<Record<string, unknown>>) => void;
  clearStore: () => void;
  
  // Check if data is stale (older than 5 minutes)
  isStatsStale: () => boolean;
  isComplaintsStale: () => boolean;
  isMetadataStale: () => boolean;
}

const STALE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  stats: null,
  statsLastFetched: null,
  complaints: [],
  complaintsLastFetched: null,
  statuses: [],
  types: [],
  users: [],
  metadataLastFetched: null,
  statsResponseData: null,
  
  // Actions
  setStats: (stats, responseData) => set({
    stats,
    statsLastFetched: Date.now(),
    statsResponseData: responseData || null,
  }),
  
  setComplaints: (complaints) => set({
    complaints,
    complaintsLastFetched: Date.now(),
  }),
  
  setStatuses: (statuses) => set({
    statuses,
    metadataLastFetched: Date.now(),
  }),
  
  setTypes: (types) => set({
    types,
    metadataLastFetched: Date.now(),
  }),
  
  setUsers: (users) => set({
    users,
    metadataLastFetched: Date.now(),
  }),
  
  clearStore: () => set({
    stats: null,
    statsLastFetched: null,
    complaints: [],
    complaintsLastFetched: null,
    statuses: [],
    types: [],
    users: [],
    metadataLastFetched: null,
    statsResponseData: null,
  }),
  
  // Check if data is stale
  isStatsStale: () => {
    const { statsLastFetched } = get();
    if (!statsLastFetched) return true;
    return Date.now() - statsLastFetched > STALE_TIME;
  },
  
  isComplaintsStale: () => {
    const { complaintsLastFetched } = get();
    if (!complaintsLastFetched) return true;
    return Date.now() - complaintsLastFetched > STALE_TIME;
  },
  
  isMetadataStale: () => {
    const { metadataLastFetched } = get();
    if (!metadataLastFetched) return true;
    return Date.now() - metadataLastFetched > STALE_TIME;
  },
}));




