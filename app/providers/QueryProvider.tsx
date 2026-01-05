"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Cache time: data stays in cache for 10 minutes after being unused
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            // Refetch on window focus: only if data is stale
            refetchOnWindowFocus: true,
            // Refetch on reconnect: only if data is stale
            refetchOnReconnect: true,
            // Retry failed requests 2 times
            retry: 2,
            // Retry delay increases exponentially
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

