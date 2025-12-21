import { useQuery } from "@tanstack/react-query";
import {
  getAgentsList,
  getAgentInventoryCount,
  getAgentsMeterCountsByType,
} from "@/lib/actions/agents";
import { getCurrentUser } from "@/lib/actions/users";

// Define interfaces - matches the return type from getAgentsList
export interface Store {
  id: string;
  name: string;
  phone_number: string;
  location: string;
  county: string;
  agent_type: string;
  is_active: boolean | null;
  is_store: boolean | null;
  created_at: Date | null;
  total_meters: number;
}

// Type for meter count by type
interface MeterTypeCount {
  type: string;
  with_agents: number;
}

// Type for initial data from server
export interface StoresPageData {
  agents: Store[]; // Reuses the same structure from getAgentsPageData
}

// Query keys - separate from agents to avoid cache conflicts
const STORES_KEYS = {
  all: ["stores"] as const,
  lists: () => [...STORES_KEYS.all, "list"] as const,
  meterCounts: () => [...STORES_KEYS.all, "meterCounts"] as const,
  storeMeterCounts: () => [...STORES_KEYS.all, "storeMeterCounts"] as const,
} as const;

// 1 hour stale time since store data changes less frequently
const STALE_TIME = 60 * 60 * 1000; // 1 hour
const GC_TIME = STALE_TIME * 2; // 2 hours

export function useStoresData(initialData?: StoresPageData) {
  const hasInitialData = !!initialData;

  // Query for stores list (agents with is_store = true) with longer cache duration
  const {
    data: stores = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: STORES_KEYS.lists(),
    queryFn: () => getAgentsList({ isStore: true }),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: initialData?.agents,
    refetchOnMount: !hasInitialData,
  });

  // Query for meter counts by type (all agents/stores combined for now)
  const { data: meterTypeCounts = [] } = useQuery({
    queryKey: STORES_KEYS.meterCounts(),
    queryFn: getAgentInventoryCount,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  // Convert meter counts array to a record for easy lookup
  const meterCounts = meterTypeCounts.reduce(
    (acc, item) => {
      acc[item.type.toLowerCase()] = item.with_agents;
      return acc;
    },
    {} as Record<string, number>
  );

  // Query for meter counts by store (for tooltip)
  const { data: storeMeterCounts = {} } = useQuery({
    queryKey: STORES_KEYS.storeMeterCounts(),
    queryFn: getAgentsMeterCountsByType,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  // Query for current user - getCurrentUser now returns displayName directly
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const user = await getCurrentUser();
      return user || null;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  return {
    storesData: {
      stores,
      currentUser,
      meterCounts,
      storeMeterCounts,
    },
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
