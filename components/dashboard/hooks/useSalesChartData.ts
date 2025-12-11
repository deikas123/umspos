import { useQuery } from "@tanstack/react-query";
import { getSalesChartData } from "@/lib/actions/sales";

const CACHE_TIME = 1000 * 60 * 5; // 5 minutes - keep in cache
const STALE_TIME = 1000 * 60 * 2; // 2 minutes - increased from 30s to reduce refetches

export interface SalesChartDataItem {
  date: string;
  meter_type: string;
  total_amount: number;
  user_sales: Record<string, number>;
  user_names: string[];
}

export function useSalesChartData(
  days: number,
  initialData?: SalesChartDataItem[]
) {
  return useQuery<SalesChartDataItem[]>({
    queryKey: ["salesChartData", days],
    queryFn: () => getSalesChartData(days) as Promise<SalesChartDataItem[]>,
    gcTime: CACHE_TIME,
    staleTime: STALE_TIME,
    // Use initial data for 30 days (default view) to avoid initial POST request
    initialData: days === 30 ? initialData : undefined,
    // Don't refetch on mount if we have initial data
    refetchOnMount: !(days === 30 && initialData),
  });
}
