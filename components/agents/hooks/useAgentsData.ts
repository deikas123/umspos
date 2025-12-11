import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAgentsList } from "@/lib/actions/agents";
import { getCurrentUser } from "@/lib/actions/users";

// Define interfaces - matches the return type from getAgentsList
interface Agent {
  id: string;
  name: string;
  phone_number: string;
  location: string;
  county: string;
  is_active: boolean | null;
  created_at: Date | null;
  total_meters: number;
}

// Type for initial data from server
export interface AgentsPageData {
  agents: Agent[];
}

// Query keys
const AGENTS_KEYS = {
  all: ["agents"] as const,
  lists: () => [...AGENTS_KEYS.all, "list"] as const,
} as const;

// 1 hour stale time since agent data changes less frequently
const STALE_TIME = 60 * 60 * 1000; // 1 hour
const GC_TIME = STALE_TIME * 2; // 2 hours

export function useAgentsData(initialData?: AgentsPageData) {
  const queryClient = useQueryClient();
  const hasInitialData = !!initialData;

  // Note: Real-time subscriptions removed during Supabase to Better Auth migration
  // Manual refresh is now required for real-time updates

  // Query for agents list with longer cache duration
  const {
    data: agents = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: AGENTS_KEYS.lists(),
    queryFn: getAgentsList,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: initialData?.agents,
    refetchOnMount: !hasInitialData,
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
    agentsData: {
      agents,
      currentUser,
    },
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
