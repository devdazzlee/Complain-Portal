import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentService } from "../services";

// Query keys
export const assignmentKeys = {
  all: ["assignments"] as const,
  unassigned: () => [...assignmentKeys.all, "unassigned"] as const,
  assigned: () => [...assignmentKeys.all, "assigned"] as const,
  providers: () => [...assignmentKeys.all, "providers"] as const,
};

// Hook to get assigned complaints (assigned to other providers)
export function useAssignedComplaints() {
  return useQuery({
    queryKey: assignmentKeys.assigned(),
    queryFn: async () => {
      return await assignmentService.getAssignedComplaints();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook to get unassigned complaints
export function useUnassignedComplaints() {
  return useQuery({
    queryKey: assignmentKeys.unassigned(),
    queryFn: async () => {
      return await assignmentService.getUnassignedComplaints();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook to get all providers
export function useProviders() {
  return useQuery({
    queryKey: assignmentKeys.providers(),
    queryFn: async () => {
      return await assignmentService.getProviders();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation to assign complaint to a provider
export function useAssignComplaint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ complaintId, handlerId, remarks }: { complaintId: number; handlerId: number; remarks?: string }) =>
      assignmentService.assignComplaint(complaintId, handlerId, remarks),
    onSuccess: () => {
      // Invalidate both assignments and complaints
      queryClient.invalidateQueries({ queryKey: assignmentKeys.assigned() });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.unassigned() });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
  });
}

