import { create } from 'zustand';

interface Role {
  id: number;
  name: string;
}

interface UserWithRoleId {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'provider' | 'admin';
  phone?: string;
  avatar?: string;
  roleId?: number;
}

interface UserManagementState {
  roles: Role[];
  users: UserWithRoleId[];
  lastFetchedRoles: number | null;
  lastFetchedUsers: number | null;
  setRoles: (roles: Role[]) => void;
  setUsers: (users: UserWithRoleId[]) => void;
  clearAll: () => void;
  isRolesStale: () => boolean;
  isUsersStale: () => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserManagementStore = create<UserManagementState>((set, get) => ({
  roles: [],
  users: [],
  lastFetchedRoles: null,
  lastFetchedUsers: null,

  setRoles: (roles: Role[]) => {
    set({ roles, lastFetchedRoles: Date.now() });
  },

  setUsers: (users: UserWithRoleId[]) => {
    set({ users, lastFetchedUsers: Date.now() });
  },

  clearAll: () => {
    set({
      roles: [],
      users: [],
      lastFetchedRoles: null,
      lastFetchedUsers: null,
    });
  },

  isRolesStale: () => {
    const { lastFetchedRoles } = get();
    if (!lastFetchedRoles) return true;
    return Date.now() - lastFetchedRoles > CACHE_DURATION;
  },

  isUsersStale: () => {
    const { lastFetchedUsers } = get();
    if (!lastFetchedUsers) return true;
    return Date.now() - lastFetchedUsers > CACHE_DURATION;
  },
}));

