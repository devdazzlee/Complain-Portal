import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "../services";

// Query keys
export const settingsKeys = {
  all: ["settings"] as const,
  settings: () => [...settingsKeys.all] as const,
};

// Hook to get settings
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.settings(),
    queryFn: async () => {
      const response = await settingsService.get();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation to update settings
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: { email_notifications?: number; sms_notifications?: number }) =>
      settingsService.update(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.settings() });
    },
  });
}

