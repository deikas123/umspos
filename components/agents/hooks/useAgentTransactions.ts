import { useQuery } from "@tanstack/react-query";
import { getAgentTransactions } from "@/lib/actions/agents";

const GC_TIME = 1000 * 60 * 10; // 10 minutes
const STALE_TIME = 1000 * 60 * 2; // 2 minutes

export function useAgentTransactions(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = ""
) {
  return useQuery({
    queryKey: ["agentTransactions", page, limit, searchTerm],
    queryFn: () => getAgentTransactions(page, limit, searchTerm),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}
