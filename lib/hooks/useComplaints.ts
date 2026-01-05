import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintService } from "../services";
import { Complaint } from "../../app/types";

// Query keys
export const complaintKeys = {
  all: ["complaints"] as const,
  lists: () => [...complaintKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...complaintKeys.lists(), filters] as const,
  details: () => [...complaintKeys.all, "detail"] as const,
  detail: (id: string | number) => [...complaintKeys.details(), id] as const,
  statuses: () => [...complaintKeys.all, "statuses"] as const,
  types: () => [...complaintKeys.all, "types"] as const,
  priorities: () => [...complaintKeys.all, "priorities"] as const,
  sortBy: () => [...complaintKeys.all, "sortBy"] as const,
};

// Map complaints from API response
const mapComplaintsFromResponse = (complaintsResponse: any): Complaint[] => {
  const apiComplaints = complaintsResponse?.complaints || complaintsResponse?.payload || complaintsResponse?.data || complaintsResponse;
  const complaintsList = Array.isArray(apiComplaints) ? apiComplaints : [];
  
  return complaintsList.map((item: Record<string, unknown>) => {
    // Get the latest status from history array
    const history = (item.history as Array<Record<string, unknown>>) || [];
    const latestStatus = history.length > 0 
      ? (history[history.length - 1].status as Record<string, unknown>)
      : null;
    const statusLabel = latestStatus?.label as string || "Open";
    
    // Map status
    const statusStr = statusLabel?.toLowerCase() || '';
    let mappedStatus: "Open" | "In Progress" | "Closed" | "Refused" = 'Open';
    if (statusStr.includes('open')) mappedStatus = 'Open';
    else if (statusStr.includes('progress') || statusStr.includes('pending')) mappedStatus = 'In Progress';
    else if (statusStr.includes('closed') || statusStr.includes('resolved')) mappedStatus = 'Closed';
    else if (statusStr.includes('refused') || statusStr.includes('rejected')) mappedStatus = 'Refused';
    
    // Get type from type object
    const typeObj = item.type as Record<string, unknown> || {};
    const typeName = (typeObj.name as string) || (typeObj.code as string) || "Other";
    
    // Get priority from priority object
    const priorityObj = item.priority as Record<string, unknown> || {};
    const priorityLabel = (priorityObj.label as string) || "Medium";
    
    // Get files/attachments
    const files = (item.files as Array<Record<string, unknown>>) || [];
    const attachments = files.map((file: Record<string, unknown>) => ({
      id: String(file.id || ''),
      name: (file.file_name as string) || '',
      url: (file.url as string) || '',
      type: (file.type as string) || 'image',
      size: 0,
      uploadedBy: '',
      uploadedAt: new Date().toISOString(),
    }));
    
    // Map timeline from history
    const timeline = history.map((hist: Record<string, unknown>) => {
      const statusObj = hist.status as Record<string, unknown> || {};
      const statusLabel = statusObj.label as string || 'Unknown';
      const statusCode = statusObj.code as string || '';
      return {
        status: statusLabel,
        date: new Date().toISOString(),
        description: (hist["Handler Remarks"] as string) || '',
        isCompleted: statusCode === 'closed',
        isRefused: statusCode === 'refused',
        userName: (hist["Case Handle By"] as string) || undefined,
      };
    });
    
    // Helper function to safely format dates
    const formatDate = (dateString: string | undefined | null): string | null => {
      if (!dateString || dateString.trim() === '') return null;
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch {
        return null;
      }
    };
    
    // Get dates from API - check multiple possible locations
    const createdAt = item.created_at as string || 
                     item.createdAt as string || 
                     (history.length > 0 && history[0].created_at ? String(history[0].created_at) : '') ||
                     '';
    const updatedAt = item.updated_at as string || 
                     item.updatedAt as string || 
                     (history.length > 0 && history[history.length - 1].updated_at ? String(history[history.length - 1].updated_at) : '') ||
                     '';
    
    // Format dates safely - use current date as fallback if no date available
    const formattedCreatedAt = formatDate(createdAt);
    const formattedUpdatedAt = formatDate(updatedAt);
    
    const dateSubmitted = formattedCreatedAt || 
                         (history.length > 0 ? formatDate(String(history[0].created_at || history[0].updated_at || '')) : null) ||
                         new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    
    const lastUpdate = formattedUpdatedAt ||
                      (history.length > 0 ? formatDate(String(history[history.length - 1].updated_at || history[history.length - 1].created_at || '')) : null) ||
                      dateSubmitted;

    return {
      id: String(item.id || Date.now()),
      complaintId: `CMP-${item.id}`,
      caretaker: String(item.Complainant || item.caretaker_name || item.client_name || "Unknown"),
      typeOfProblem: (typeName === "Late Arrival" ? "Late arrival" : typeName) as any,
      description: String(item.description || ""),
      dateSubmitted: dateSubmitted,
      lastUpdate: lastUpdate,
      status: mappedStatus,
      priority: priorityLabel as any,
      category: undefined,
      tags: [],
      attachments: attachments,
      timeline: timeline,
    };
  });
};

// Hook to get all complaints
export function useComplaints() {
  return useQuery({
    queryKey: complaintKeys.lists(),
    queryFn: async () => {
      const response = await complaintService.getAll();
      return mapComplaintsFromResponse(response);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - complaints change frequently
  });
}

// Hook to get a single complaint by ID
export function useComplaint(id: string | number) {
  return useQuery({
    queryKey: complaintKeys.detail(id),
    queryFn: async () => {
      const response = await complaintService.getById(id);
      if (!response.complaint) return null;
      // Return raw complaint data for edit page to extract IDs
      return response.complaint as Record<string, unknown>;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook to get complaint statuses
export function useComplaintStatuses() {
  return useQuery({
    queryKey: complaintKeys.statuses(),
    queryFn: async () => {
      const response = await complaintService.getStatuses();
      const apiStatuses = response?.statuses || response?.payload || response?.data || (Array.isArray(response) ? response : []);
      return Array.isArray(apiStatuses) ? apiStatuses : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - statuses rarely change
  });
}

// Hook to get complaint types
export function useComplaintTypes() {
  return useQuery({
    queryKey: complaintKeys.types(),
    queryFn: async () => {
      const response = await complaintService.getTypes();
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - types rarely change
  });
}

// Hook to get complaint priorities
export function useComplaintPriorities() {
  return useQuery({
    queryKey: complaintKeys.priorities(),
    queryFn: async () => {
      const response = await complaintService.getPriorities();
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - priorities rarely change
  });
}

// Hook to get sort by options
export function useSortByOptions() {
  return useQuery({
    queryKey: complaintKeys.sortBy(),
    queryFn: async () => {
      const response = await complaintService.getSortByOptions();
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to search complaints
export function useSearchComplaints(filters: {
  general_search?: string;
  status_id?: number;
  priority_id?: number;
  type_id?: number;
  starting_date?: string;
  end_date?: string;
}) {
  // Check if we have meaningful filters (not just empty general_search)
  const hasFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof typeof filters];
    if (key === 'general_search') {
      return value !== undefined && value !== null && value !== "" && String(value).trim() !== "";
    }
    return value !== undefined && value !== null && value !== "";
  });
  
  return useQuery({
    queryKey: [...complaintKeys.lists(), "search", filters],
    queryFn: async () => {
      const response = await complaintService.search(filters);
      return mapComplaintsFromResponse(response);
    },
    enabled: hasFilters,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Mutation to add a complaint
export function useAddComplaint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (complaintData: FormData) => complaintService.add(complaintData),
    onSuccess: () => {
      // Invalidate and refetch complaints list
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
    },
  });
}

// Mutation to update a complaint
export function useUpdateComplaint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (complaintData: FormData) => complaintService.update(complaintData),
    onSuccess: (_, variables) => {
      // Invalidate complaints list and specific complaint detail
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
      // Try to extract complaint_id from FormData
      const complaintId = variables.get('complaint_id');
      if (complaintId) {
        queryClient.invalidateQueries({ queryKey: complaintKeys.detail(complaintId.toString()) });
      }
    },
  });
}

// Mutation to delete a complaint
export function useDeleteComplaint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (complaintId: number) => complaintService.delete(complaintId),
    onSuccess: () => {
      // Invalidate complaints list
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
    },
  });
}

