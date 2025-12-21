"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getAgentsList } from "@/lib/actions/agents";
import {
  getRemainingMetersByType,
  getAgentInventoryCount,
} from "@/lib/actions/reports";

const CACHE_TIME = 1000 * 60 * 10;
const STALE_TIME = 1000 * 60 * 2;

// Track which routes have been prefetched to avoid duplicate requests
const prefetchedRoutes = new Set<string>();

export function PrefetchProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const hasPrefetched = useRef(false);

  // Minimal initial prefetch - only essential shared data
  useEffect(() => {
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;

    // Delay prefetch to not compete with initial page load
    const timer = setTimeout(() => {
      // Only prefetch truly shared data that's used across multiple pages
      // Dashboard data is now fetched server-side, so we skip it here
      Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ["agents", "list"],
          queryFn: () => getAgentsList({ isStore: false }),
          staleTime: 60 * 60 * 1000, // 1 hour - agents rarely change
          gcTime: CACHE_TIME,
        }),
        queryClient.prefetchQuery({
          queryKey: ["remainingMetersByType"],
          queryFn: () => getRemainingMetersByType(),
          staleTime: STALE_TIME,
          gcTime: CACHE_TIME,
        }),
      ]).catch((error) => {
        console.warn("Auto-prefetch failed:", error);
      });
    }, 1000); // Increased delay to 1 second

    return () => clearTimeout(timer);
  }, [queryClient]);

  // Route-based prefetching - prefetch data for likely next pages
  useEffect(() => {
    if (!pathname || prefetchedRoutes.has(pathname)) return;
    prefetchedRoutes.add(pathname);

    const timer = setTimeout(() => {
      // Based on current route, prefetch likely next destinations
      // Note: Dashboard and Sales fetch their own data server-side now
      // So we only prefetch supporting data they might need
      if (pathname === "/dashboard" || pathname === "/sales") {
        // User might check agents or inventory
        queryClient.prefetchQuery({
          queryKey: ["agentInventory"],
          queryFn: () => getAgentInventoryCount(),
          staleTime: STALE_TIME,
          gcTime: CACHE_TIME,
        });
      }
      // Add more route-based prefetching as needed
    }, 2000); // 2 second delay for route-based prefetch

    return () => clearTimeout(timer);
  }, [pathname, queryClient]);

  return <>{children}</>;
}
