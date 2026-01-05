import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services";

// Query keys
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
};

// Hook to get all notifications
export function useNotifications(title?: string) {
  return useQuery({
    queryKey: [...notificationKeys.lists(), title],
    queryFn: async () => {
      const response = await notificationService.getAll(title);
      const apiNotifications = response?.notifications || response?.payload || response?.data || response;
      return Array.isArray(apiNotifications) ? apiNotifications : [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute - notifications change frequently
    refetchInterval: title ? undefined : 30 * 1000, // Only refetch automatically if not searching
  });
}

// Mutation to add a notification
export function useAddNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ title, body }: { title: string; body: string }) =>
      notificationService.add(title, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

// Mutation to delete a notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: number) => notificationService.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

// Mutation to mark notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

