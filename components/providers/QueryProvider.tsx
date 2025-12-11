"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 10 minutes in memory (increased from 5)
            gcTime: 1000 * 60 * 10,
            // Consider data stale after 2 minutes (increased from 30 seconds)
            // This significantly reduces background refetches
            staleTime: 1000 * 60 * 2,
            // Disable automatic refetches to reduce POST requests
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            // Retry failed requests once (network issues)
            retry: 1,
            // Retry delay (exponential backoff)
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
