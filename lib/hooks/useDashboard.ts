import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services";
import { DashboardStats } from "../../app/types";

// Query keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  roles: () => [...dashboardKeys.all, "roles"] as const,
  users: (name?: string) => [...dashboardKeys.all, "users", name] as const,
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

