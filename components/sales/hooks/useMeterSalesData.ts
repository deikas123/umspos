import { useQuery } from "@tanstack/react-query";
import { getSaleBatches } from "@/lib/actions/sales";

export interface SaleBatch {
  id: string;
  user_name: string;
  meter_type: string;
  batch_amount: number;
  sale_date: Date | null;
  destination: string;
  recipient: string;
  total_price: number;
  unit_price: number;
  customer_type: string | null;
  customer_region: string | null;
  customer_county: string | null;
  customer_contact: string | null;
  transaction_id: string | null;
  notes: string | null;
  note_by: string | null;
  referral_user_id: string | null;
  referral_name: string | null;
  // Pickup information
  picked_by_type: string | null;
  picked_by_name: string | null;
  picked_by_contact: string | null;
}

export interface SaleBatchesResponse {
  batches: SaleBatch[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const CACHE_TIME = 1000 * 60 * 10; // 10 minutes
const STALE_TIME = 1000 * 60 * 2; // 2 minutes - increased from 30s

export function useMeterSalesData(
  page: number = 1,
  limit: number = 10,
  filters?: {
    searchUser?: string;
    meterType?: string;
    customerType?: string;
    dateRange?: { start: Date; end: Date };
    specificDate?: Date;
  },
  initialData?: SaleBatchesResponse
) {
  // Check if this is the initial unfiltered first page load
  const isInitialLoad =
    page === 1 &&
    !filters?.searchUser &&
    !filters?.meterType &&
    !filters?.customerType &&
    !filters?.dateRange &&
    !filters?.specificDate;

  // Fetch sales data with caching and server-side pagination
  const salesQuery = useQuery({
    queryKey: ["saleBatches", page, limit, filters],
    queryFn: async () => {
      const data = await getSaleBatches(page, limit, filters);
      return data;
    },
    gcTime: CACHE_TIME,
    staleTime: STALE_TIME,
    placeholderData: (previousData) => previousData,
    // Use initial data for first page without filters to avoid initial POST request
    initialData: isInitialLoad ? initialData : undefined,
    // Don't refetch on mount if we have initial data for this exact query
    refetchOnMount: !(isInitialLoad && initialData),
  });

  return {
    saleBatches: salesQuery.data?.batches || [],
    pagination: salesQuery.data?.pagination || {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
    isLoading: salesQuery.isLoading,
    isFetching: salesQuery.isFetching,
    isError: salesQuery.isError,
    error: salesQuery.error,
    refetch: async (options?: { throwOnError?: boolean }) => {
      return salesQuery.refetch({
        cancelRefetch: false,
        throwOnError: options?.throwOnError ?? false,
      });
    },
  };
}
