import { useQuery } from "@tanstack/react-query";
import { dashboardService, userManagementService } from "../services";
import { DashboardStats } from "../../app/types";

// Query keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  roles: () => [...dashboardKeys.all, "roles"] as const,
  users: (name?: string) => [...dashboardKeys.all, "users", name] as const,
  usersNoLimit: () => [...dashboardKeys.all, "users", "no-limit"] as const,
  admins: () => [...dashboardKeys.all, "users", "admins"] as const,
  providers: () => [...dashboardKeys.all, "users", "providers"] as const,
};

// Hook to get dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const response = await dashboardService.getStats();
      const apiStats = response?.states || response?.payload || response?.data || response;
      
      const stats: DashboardStats = {
        openComplaints: apiStats?.open_complaints || apiStats?.open || 0,
        pendingFollowups: apiStats?.pending_followups || apiStats?.pending || 0,
        resolvedThisMonth: apiStats?.resolved_this_month || apiStats?.resolved || 0,
        refusedComplaints: apiStats?.refused_complaints || apiStats?.refused || 0,
      };
      
      return { stats, rawResponse: response };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get all roles
export function useRoles() {
  return useQuery({
    queryKey: dashboardKeys.roles(),
    queryFn: async () => {
      const response = await dashboardService.getRoles();
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - roles rarely change
  });
}

// Hook to get all users
export function useUsers(name?: string) {
  return useQuery({
    queryKey: dashboardKeys.users(name),
    queryFn: async () => {
      const response = await dashboardService.getUsers(name);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get all users with no limit
export function useUsersNoLimit() {
  return useQuery({
    queryKey: dashboardKeys.usersNoLimit(),
    queryFn: async () => {
      const response = await userManagementService.getAllUsersNoLimit();
      const users = response?.users || response?.data || response || [];
      return Array.isArray(users) ? users : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get all admins
export function useAdmins() {
  return useQuery({
    queryKey: dashboardKeys.admins(),
    queryFn: async () => {
      const response = await userManagementService.getAllAdmins();
      const users = response?.users || response?.data || response || [];
      return Array.isArray(users) ? users : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get all providers (for user management)
export function useAllProviders() {
  return useQuery({
    queryKey: dashboardKeys.providers(),
    queryFn: async () => {
      const response = await userManagementService.getAllProviders();
      const users = response?.users || response?.data || response || [];
      return Array.isArray(users) ? users : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}


