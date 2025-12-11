import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTopSellingUsers,
  getMostSellingProduct,
  getEarningsByMeterType,
  getCustomerTypeCounts,
  getRegionDistribution,
  getRemainingMetersByType,
  getAgentInventoryCount,
} from "@/lib/actions/reports";
import type { TopSeller } from "../types";

// Define query keys
const QUERY_KEYS = {
  topSellers: "topSellers",
  mostSellingProduct: "mostSellingProduct",
  earnings: "earnings",
  customerTypes: "customerTypes",
  regionDistribution: "regionDistribution",
  remainingMetersByType: "remainingMetersByType",
  agentInventory: "agentInventory",
} as const;

const GC_TIME = 1000 * 60 * 10; // 10 minutes
const STALE_TIME = 1000 * 60 * 2; // 2 minutes - increased from 1 minute

// Type for initial data from server
export interface ReportsPageData {
  remainingMetersByType: Array<{ type: string; remaining_meters: number }>;
  agentInventory: Array<{ type: string; with_agents: number }>;
  mostSellingProduct: string;
  customerTypeData: Array<{ type: string; count: number }>;
  regionDistribution: Array<{ region: string; count: number }>;
  earningsByMeterType: Array<{ meter_type: string; total_earnings: number }>;
  totalEarnings: number;
}

export function useReportsData(initialData?: ReportsPageData) {
  const { userRole } = useAuth();

  // Determine if user has reports access (avoid extra query)
  const hasReportsAccess = userRole === "admin" || userRole === "accountant";
  const hasInitialData = !!initialData;

  // Remaining meters query - use initialData if available
  const remainingMetersQuery = useQuery({
    queryKey: [QUERY_KEYS.remainingMetersByType],
    queryFn: getRemainingMetersByType,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: initialData?.remainingMetersByType,
    refetchOnMount: !hasInitialData,
  });

  // Agent inventory query - use initialData if available
  const agentInventoryQuery = useQuery({
    queryKey: [QUERY_KEYS.agentInventory],
    queryFn: getAgentInventoryCount,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: initialData?.agentInventory,
    refetchOnMount: !hasInitialData,
  });

  // Most selling product query - use initialData if available
  const mostSellingProductQuery = useQuery({
    queryKey: [QUERY_KEYS.mostSellingProduct],
    queryFn: getMostSellingProduct,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: initialData?.mostSellingProduct,
    refetchOnMount: !hasInitialData,
  });

  // Customer types query - use initialData if available
  const customerTypesQuery = useQuery({
    queryKey: [QUERY_KEYS.customerTypes],
    queryFn: getCustomerTypeCounts,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: initialData?.customerTypeData,
    refetchOnMount: !hasInitialData,
  });

  // Region distribution query - use initialData if available
  const regionDistributionQuery = useQuery({
    queryKey: [QUERY_KEYS.regionDistribution],
    queryFn: getRegionDistribution,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: initialData?.regionDistribution,
    refetchOnMount: !hasInitialData,
  });

  // Earnings query (admin/accountant only) - use initialData if available
  const earningsQuery = useQuery({
    queryKey: [QUERY_KEYS.earnings],
    queryFn: getEarningsByMeterType,
    enabled: hasReportsAccess,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: hasReportsAccess
      ? initialData?.earningsByMeterType
      : undefined,
    refetchOnMount: !hasInitialData,
  });

  // Top sellers query (not in initial data, fetches on demand)
  const topSellersQuery = useQuery({
    queryKey: [QUERY_KEYS.topSellers],
    queryFn: async () => {
      const topUsers = await getTopSellingUsers();
      return topUsers
        .reduce((acc: TopSeller[], seller) => {
          const existingSeller = acc.find(
            (s) => s.user_name === seller.user_name
          );
          if (existingSeller) {
            existingSeller.total_sales += Number.parseFloat(seller.total_sales);
          } else {
            acc.push({
              user_name: seller.user_name,
              total_sales: Number.parseFloat(seller.total_sales),
            });
          }
          return acc;
        }, [])
        .sort((a, b) => b.total_sales - a.total_sales);
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  // Optimized loading check - only check required queries
  const isLoading =
    remainingMetersQuery.isLoading ||
    mostSellingProductQuery.isLoading ||
    agentInventoryQuery.isLoading ||
    customerTypesQuery.isLoading ||
    regionDistributionQuery.isLoading ||
    (hasReportsAccess && earningsQuery.isLoading);

  const isFetching =
    remainingMetersQuery.isFetching ||
    topSellersQuery.isFetching ||
    mostSellingProductQuery.isFetching ||
    agentInventoryQuery.isFetching ||
    customerTypesQuery.isFetching ||
    regionDistributionQuery.isFetching ||
    (hasReportsAccess && earningsQuery.isFetching);

  // Optimized error check
  const error =
    remainingMetersQuery.error ||
    topSellersQuery.error ||
    mostSellingProductQuery.error ||
    agentInventoryQuery.error ||
    customerTypesQuery.error ||
    regionDistributionQuery.error ||
    (hasReportsAccess && earningsQuery.error);

  return {
    data: {
      remainingMetersByType: remainingMetersQuery.data || [],
      topSellers: topSellersQuery.data || [],
      mostSellingProduct: mostSellingProductQuery.data || "",
      earningsByMeterType: earningsQuery.data || [],
      totalEarnings:
        earningsQuery.data?.reduce(
          (sum, item) => sum + item.total_earnings,
          0
        ) ||
        initialData?.totalEarnings ||
        0,
      userRole: userRole || "",
      agentInventory: agentInventoryQuery.data || [],
      customerTypeData: customerTypesQuery.data || [],
      regionDistribution: regionDistributionQuery.data || [],
    },
    isLoading,
    isFetching,
    error,
    refetch: async (options?: { throwOnError?: boolean }) => {
      const refetchOptions = {
        cancelRefetch: false,
        throwOnError: options?.throwOnError ?? false,
      } as const;

      const queries: Array<Promise<unknown>> = [
        topSellersQuery.refetch(refetchOptions),
        mostSellingProductQuery.refetch(refetchOptions),
        customerTypesQuery.refetch(refetchOptions),
        regionDistributionQuery.refetch(refetchOptions),
        remainingMetersQuery.refetch(refetchOptions),
        agentInventoryQuery.refetch(refetchOptions),
      ];

      if (hasReportsAccess) {
        queries.push(earningsQuery.refetch(refetchOptions));
      }

      await Promise.all(queries);
    },
  };
}
