import { useQuery } from "@tanstack/react-query";
import { complaintService } from "../services";

// Query keys
export const reportKeys = {
  all: ["reports"] as const,
  report: (startDate: string, endDate: string) => [...reportKeys.all, startDate, endDate] as const,
};

// Hook to get complaint report
export function useComplaintReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: reportKeys.report(startDate, endDate),
    queryFn: async () => {
      const response = await complaintService.getReport(startDate, endDate);
      return response;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}


