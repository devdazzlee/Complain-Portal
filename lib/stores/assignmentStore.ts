import { create } from 'zustand';
import { Complaint } from '../../app/types';

interface Provider {
  id: number | string;
  name: string;
  email?: string;
  role?: string;
}

interface AssignmentState {
  unassignedComplaints: Complaint[];
  providers: Provider[];
  lastFetchedComplaints: number | null;
  lastFetchedProviders: number | null;
  setUnassignedComplaints: (complaints: Complaint[]) => void;
  setProviders: (providers: Provider[]) => void;
  clearAll: () => void;
  isComplaintsStale: () => boolean;
  isProvidersStale: () => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  unassignedComplaints: [],
  providers: [],
  lastFetchedComplaints: null,
  lastFetchedProviders: null,

  setUnassignedComplaints: (complaints: Complaint[]) => {
    set({ unassignedComplaints: complaints, lastFetchedComplaints: Date.now() });
  },

  setProviders: (providers: Provider[]) => {
    set({ providers, lastFetchedProviders: Date.now() });
  },

  clearAll: () => {
    set({
      unassignedComplaints: [],
      providers: [],
      lastFetchedComplaints: null,
      lastFetchedProviders: null,
    });
  },

  isComplaintsStale: () => {
    const { lastFetchedComplaints } = get();
    if (!lastFetchedComplaints) return true;
    return Date.now() - lastFetchedComplaints > CACHE_DURATION;
  },

  isProvidersStale: () => {
    const { lastFetchedProviders } = get();
    if (!lastFetchedProviders) return true;
    return Date.now() - lastFetchedProviders > CACHE_DURATION;
  },
}));



