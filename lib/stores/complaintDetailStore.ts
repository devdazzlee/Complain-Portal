import { create } from 'zustand';
import { Complaint } from '../../app/types';

interface ComplaintDetailState {
  complaints: Record<string, Complaint>; // key: complaintId, value: Complaint
  lastFetched: Record<string, number>; // key: complaintId, value: timestamp
  setComplaint: (complaintId: string, complaint: Complaint) => void;
  getComplaint: (complaintId: string) => Complaint | undefined;
  isStale: (complaintId: string) => boolean;
  clearComplaint: (complaintId: string) => void;
  clearAll: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useComplaintDetailStore = create<ComplaintDetailState>((set, get) => ({
  complaints: {},
  lastFetched: {},

  setComplaint: (complaintId: string, complaint: Complaint) => {
    set((state) => ({
      complaints: { ...state.complaints, [complaintId]: complaint },
      lastFetched: { ...state.lastFetched, [complaintId]: Date.now() },
    }));
  },

  getComplaint: (complaintId: string) => {
    return get().complaints[complaintId];
  },

  isStale: (complaintId: string) => {
    const { lastFetched } = get();
    const fetched = lastFetched[complaintId];
    if (!fetched) return true;
    return Date.now() - fetched > CACHE_DURATION;
  },

  clearComplaint: (complaintId: string) => {
    set((state) => {
      const { [complaintId]: removed, ...complaints } = state.complaints;
      const { [complaintId]: removedTime, ...lastFetched } = state.lastFetched;
      return { complaints, lastFetched };
    });
  },

  clearAll: () => {
    set({
      complaints: {},
      lastFetched: {},
    });
  },
}));




