import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAgentTransactions } from "@/lib/actions/agents";

const GC_TIME = 1000 * 60 * 10; // 10 minutes
const STALE_TIME = 1000 * 60 * 2; // 2 minutes

export interface TransactionFilters {
  transactionType?: string;
  meterType?: string;
  agentId?: string;
  startDate?: Date;
  endDate?: Date;
}

export function useAgentTransactions(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  filters?: TransactionFilters
) {
  return useQuery({
    queryKey: ["agentTransactions", page, limit, searchTerm, filters],
    queryFn: () => getAgentTransactions(page, limit, searchTerm, filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

// Function to fetch all transactions for export (no pagination)
export async function getAllTransactionsForExport(
  searchTerm: string = "",
  filters?: TransactionFilters
) {
  // Fetch with a very high limit to get all records
  const result = await getAgentTransactions(1, 10000, searchTerm, filters);
  return result.transactions;
}
