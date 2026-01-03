import { create } from 'zustand';
import { Complaint } from '../../app/types';

interface SearchState {
  results: Complaint[];
  statuses: Array<Record<string, unknown>>;
  types: Array<Record<string, unknown>>;
  priorities: Array<Record<string, unknown>>;
  sortByOptions: Array<Record<string, unknown>>;
  lastFetchedResults: number | null;
  lastFetchedMetadata: number | null;
  setResults: (results: Complaint[]) => void;
  setStatuses: (statuses: Array<Record<string, unknown>>) => void;
  setTypes: (types: Array<Record<string, unknown>>) => void;
  setPriorities: (priorities: Array<Record<string, unknown>>) => void;
  setSortByOptions: (sortByOptions: Array<Record<string, unknown>>) => void;
  clearResults: () => void;
  clearAll: () => void;
  isResultsStale: () => boolean;
  isMetadataStale: () => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const METADATA_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (statuses/types/priorities change less frequently)

export const useSearchStore = create<SearchState>((set, get) => ({
  results: [],
  statuses: [],
  types: [],
  priorities: [],
  sortByOptions: [],
  lastFetchedResults: null,
  lastFetchedMetadata: null,

  setResults: (results: Complaint[]) => {
    set({ results, lastFetchedResults: Date.now() });
  },

  setStatuses: (statuses: Array<Record<string, unknown>>) => {
    set({ statuses, lastFetchedMetadata: Date.now() });
  },

  setTypes: (types: Array<Record<string, unknown>>) => {
    set({ types, lastFetchedMetadata: Date.now() });
  },

  setPriorities: (priorities: Array<Record<string, unknown>>) => {
    set({ priorities, lastFetchedMetadata: Date.now() });
  },

  setSortByOptions: (sortByOptions: Array<Record<string, unknown>>) => {
    set({ sortByOptions, lastFetchedMetadata: Date.now() });
  },

  clearResults: () => {
    set({ results: [], lastFetchedResults: null });
  },

  clearAll: () => {
    set({
      results: [],
      statuses: [],
      types: [],
      priorities: [],
      sortByOptions: [],
      lastFetchedResults: null,
      lastFetchedMetadata: null,
    });
  },

  isResultsStale: () => {
    const { lastFetchedResults } = get();
    if (!lastFetchedResults) return true;
    return Date.now() - lastFetchedResults > CACHE_DURATION;
  },

  isMetadataStale: () => {
    const { lastFetchedMetadata } = get();
    if (!lastFetchedMetadata) return true;
    return Date.now() - lastFetchedMetadata > METADATA_CACHE_DURATION;
  },
}));


