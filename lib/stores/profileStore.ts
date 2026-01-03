import { create } from 'zustand';

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
}

interface ProfileState {
  profile: UserProfile | null;
  lastFetched: number | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearAll: () => void;
  isStale: () => boolean;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (profile doesn't change often)

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  lastFetched: null,

  setProfile: (profile: UserProfile) => {
    set({ profile, lastFetched: Date.now() });
  },

  updateProfile: (updates: Partial<UserProfile>) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    }));
  },

  clearAll: () => {
    set({
      profile: null,
      lastFetched: null,
    });
  },

  isStale: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    return Date.now() - lastFetched > CACHE_DURATION;
  },
}));



