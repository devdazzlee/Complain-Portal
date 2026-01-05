import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dswService, clientService, complaintService } from "../services";

// Query keys for form data
export const formDataKeys = {
  all: ["formData"] as const,
  dsws: () => [...formDataKeys.all, "dsws"] as const,
  clients: () => [...formDataKeys.all, "clients"] as const,
  types: () => [...formDataKeys.all, "types"] as const,
  priorities: () => [...formDataKeys.all, "priorities"] as const,
};

// Hook to get DSWs
export function useDsws(title?: string) {
  return useQuery({
    queryKey: [...formDataKeys.dsws(), title],
    queryFn: async () => {
      const response = await dswService.getAll(title);
      const dswsList = Array.isArray(response) ? response : [];
      return dswsList.map((dsw: Record<string, unknown>) => ({
        id: Number(dsw.id || 0),
        name: String(dsw.name || dsw.first_name || dsw.username || ''),
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    retryDelay: 1000,
  });
}

// Hook to get Clients
export function useClients(title?: string) {
  return useQuery({
    queryKey: [...formDataKeys.clients(), title],
    queryFn: async () => {
      const response = await clientService.getAll(title);
      const clientsList = Array.isArray(response) ? response : [];
      return clientsList.map((client: Record<string, unknown>) => ({
        id: Number(client.id || 0),
        name: String(client.name || client.first_name || client.username || ''),
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    retryDelay: 1000,
  });
}

// Hook to get Types
export function useTypes() {
  return useQuery({
    queryKey: formDataKeys.types(),
    queryFn: async () => {
      const types = await complaintService.getTypes();
      return Array.isArray(types) ? types : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (types don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    retryDelay: 1000,
  });
}

// Hook to get Priorities
export function usePriorities() {
  return useQuery({
    queryKey: formDataKeys.priorities(),
    queryFn: async () => {
      const priorities = await complaintService.getPriorities();
      return Array.isArray(priorities) ? priorities : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (priorities don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * Hook to add a new type
 */
export function useAddType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => complaintService.addType(name),
    onSuccess: () => {
      // Invalidate types query to refetch and show new type
      queryClient.invalidateQueries({ queryKey: formDataKeys.types() });
    },
  });
}

