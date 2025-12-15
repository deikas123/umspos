import { useQuery } from "@tanstack/react-query";
import {
  getDetailedSalesToday,
  getDetailedSalesYesterday,
  getRemainingMetersByType,
  getAgentInventoryCount,
  getFaultyMetersByType,
} from "@/lib/actions/reports";

const GC_TIME = 1000 * 60 * 10; // 10 minutes
const STALE_TIME = 1000 * 60 * 2; // 2 minutes - increased from 30 seconds

// Type for sold meter data
interface SoldMeterData {
  batch_id: string;
  serial_number: string;
  recipient: string;
  destination: string;
  customer_type: string | null;
  customer_county: string | null;
  customer_contact: string | null;
}

// Type for sale batch data - matches the return type from getDetailedSalesByDateRange
interface SaleBatchData {
  id: string;
  user_id: string;
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
  picked_by_type: string | null;
  picked_by_name: string | null;
  picked_by_contact: string | null;
  meters: SoldMeterData[];
}

// Type for initial data from server - matches the return type from getDailyReportsPageData
export interface DailyReportsPageData {
  todaySales: SaleBatchData[];
  yesterdaySales: SaleBatchData[];
  remainingMetersByType: Array<{ type: string; remaining_meters: number }>;
  agentInventory: Array<{ type: string; with_agents: number }>;
  faultyMetersByType: Array<{ type: string; faulty_count: number }>;
}

/**
 * Hook for fetching today's detailed sales
 */
export function useTodaySales(
  initialData?: DailyReportsPageData["todaySales"]
) {
  return useQuery({
    queryKey: ["detailedSales", "today"],
    queryFn: getDetailedSalesToday,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
    initialData,
    refetchOnMount: !initialData,
  });
}

/**
 * Hook for fetching yesterday's detailed sales
 */
export function useYesterdaySales(
  initialData?: DailyReportsPageData["yesterdaySales"]
) {
  return useQuery({
    queryKey: ["detailedSales", "yesterday"],
    queryFn: getDetailedSalesYesterday,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
    initialData,
    refetchOnMount: !initialData,
  });
}

/**
 * Hook for fetching remaining meters by type
 * Shared across multiple components - high cache value
 */
export function useRemainingMetersByType(
  initialData?: DailyReportsPageData["remainingMetersByType"]
) {
  return useQuery({
    queryKey: ["remainingMetersByType"],
    queryFn: getRemainingMetersByType,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
    initialData,
    refetchOnMount: !initialData,
  });
}

/**
 * Hook for fetching agent inventory count
 * Shared across multiple components - high cache value
 */
export function useAgentInventory(
  initialData?: DailyReportsPageData["agentInventory"]
) {
  return useQuery({
    queryKey: ["agentInventory"],
    queryFn: getAgentInventoryCount,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
    initialData,
    refetchOnMount: !initialData,
  });
}

/**
 * Hook for fetching faulty meters by type (pending status)
 * Shared across multiple components - high cache value
 */
export function useFaultyMetersByType(
  initialData?: DailyReportsPageData["faultyMetersByType"]
) {
  return useQuery({
    queryKey: ["faultyMetersByType"],
    queryFn: getFaultyMetersByType,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
    initialData,
    refetchOnMount: !initialData,
  });
}

/**
 * Combined hook for all reports data
 * Accepts initialData from server-side fetch to avoid POST requests
 */
export function useAllReportsData(initialData?: DailyReportsPageData) {
  const todaySales = useTodaySales(initialData?.todaySales);
  const yesterdaySales = useYesterdaySales(initialData?.yesterdaySales);
  const remainingMeters = useRemainingMetersByType(
    initialData?.remainingMetersByType
  );
  const agentInventory = useAgentInventory(initialData?.agentInventory);
  const faultyMeters = useFaultyMetersByType(initialData?.faultyMetersByType);

  return {
    todaySales: todaySales.data ?? [],
    yesterdaySales: yesterdaySales.data ?? [],
    remainingMeters: remainingMeters.data ?? [],
    agentInventory: agentInventory.data ?? [],
    faultyMeters: faultyMeters.data ?? [],
    isLoading:
      todaySales.isLoading ||
      yesterdaySales.isLoading ||
      remainingMeters.isLoading ||
      agentInventory.isLoading ||
      faultyMeters.isLoading,
    isFetching:
      todaySales.isFetching ||
      yesterdaySales.isFetching ||
      remainingMeters.isFetching ||
      agentInventory.isFetching ||
      faultyMeters.isFetching,
    isError:
      todaySales.isError ||
      yesterdaySales.isError ||
      remainingMeters.isError ||
      agentInventory.isError ||
      faultyMeters.isError,
    refetch: async () => {
      await Promise.all([
        todaySales.refetch(),
        yesterdaySales.refetch(),
        remainingMeters.refetch(),
        agentInventory.refetch(),
        faultyMeters.refetch(),
      ]);
    },
  };
}
