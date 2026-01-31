import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllMetersWithStatus } from "@/lib/actions/exports";
import { CalendarDate } from "@internationalized/date";

// Define query keys
const QUERY_KEYS = {
  allMeters: "allMeters",
  metersByStatus: "metersByStatus",
} as const;

export type MeterStatusFilter =
  | "all"
  | "in_stock"
  | "with_agent"
  | "sold"
  | "replaced"
  | "faulty";
export type MeterTypeFilter = string | null;

export type DateRangeValue = {
  start: CalendarDate | null;
  end: CalendarDate | null;
} | null;

export function useMetersData(initialPageSize: number = 20) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [statusFilter, setStatusFilter] =
    useState<MeterStatusFilter>("in_stock");
  const [typeFilter, setTypeFilter] = useState<MeterTypeFilter>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(null);
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);

  const effectiveDateRange: DateRangeValue = selectedDate
    ? { start: selectedDate, end: selectedDate }
    : dateRange;

  const formatCalendarDate = (date: CalendarDate) => {
    const year = String(date.year);
    const month = String(date.month).padStart(2, "0");
    const day = String(date.day).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const startDateStr = effectiveDateRange?.start
    ? formatCalendarDate(effectiveDateRange.start)
    : undefined;

  const endDateStr = effectiveDateRange?.end
    ? formatCalendarDate(effectiveDateRange.end)
    : undefined;

  // Create a query key that includes all filters
  const queryKey = [
    QUERY_KEYS.allMeters,
    page,
    pageSize,
    statusFilter,
    typeFilter,
    searchTerm,
    startDateStr,
    endDateStr,
  ];

  // The main query
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const filterStatus = statusFilter === "all" ? undefined : statusFilter;

      try {
        const result = await getAllMetersWithStatus(
          page,
          pageSize,
          filterStatus,
          typeFilter || undefined,
          searchTerm || undefined,
          startDateStr,
          endDateStr,
        );

        return result;
      } catch (error) {
        console.error("Error in useMetersData query:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - increased from 1 minute
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when reconnecting
    placeholderData: (previousData) => previousData, // Replace keepPreviousData with placeholderData
  });

  // Prefetch adjacent pages
  const prefetchAdjacentPages = useCallback(() => {
    // Only prefetch if we have data
    if (!data) return;

    const totalPages = Math.ceil((data.totalCount || 0) / pageSize);
    const filterStatus = statusFilter === "all" ? undefined : statusFilter;

    // Prefetch next page if available
    if (page < totalPages) {
      const nextPage = page + 1;
      const nextPageQueryKey = [
        QUERY_KEYS.allMeters,
        nextPage,
        pageSize,
        statusFilter,
        typeFilter,
        searchTerm,
        startDateStr,
        endDateStr,
      ];

      queryClient.prefetchQuery({
        queryKey: nextPageQueryKey,
        queryFn: async () => {
          return getAllMetersWithStatus(
            nextPage,
            pageSize,
            filterStatus,
            typeFilter || undefined,
            searchTerm || undefined,
            startDateStr,
            endDateStr,
          );
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    }

    // Prefetch previous page if available
    if (page > 1) {
      const prevPage = page - 1;
      const prevPageQueryKey = [
        QUERY_KEYS.allMeters,
        prevPage,
        pageSize,
        statusFilter,
        typeFilter,
        searchTerm,
        startDateStr,
        endDateStr,
      ];

      queryClient.prefetchQuery({
        queryKey: prevPageQueryKey,
        queryFn: async () => {
          return getAllMetersWithStatus(
            prevPage,
            pageSize,
            filterStatus,
            typeFilter || undefined,
            searchTerm || undefined,
            startDateStr,
            endDateStr,
          );
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    }
  }, [
    page,
    pageSize,
    statusFilter,
    typeFilter,
    searchTerm,
    startDateStr,
    endDateStr,
    data,
    queryClient,
  ]);

  // Prefetch adjacent pages when current page data is loaded
  useEffect(() => {
    if (!isLoading && data) {
      prefetchAdjacentPages();
    }
  }, [isLoading, data, prefetchAdjacentPages]);

  // Prefetch data for different status filters
  useEffect(() => {
    if (
      !isLoading &&
      !searchTerm &&
      !typeFilter &&
      !startDateStr &&
      !endDateStr
    ) {
      // Only prefetch other status filters when not searching or filtering by type
      const statusesToPrefetch: MeterStatusFilter[] = [
        "in_stock",
        "with_agent",
        "sold",
        "replaced",
        "faulty",
      ].filter((status) => status !== statusFilter) as MeterStatusFilter[];

      statusesToPrefetch.forEach((status) => {
        const statusQueryKey = [
          QUERY_KEYS.metersByStatus,
          1, // First page
          pageSize,
          status,
          null, // No type filter
          "", // No search term
          undefined,
          undefined,
        ];

        queryClient.prefetchQuery({
          queryKey: statusQueryKey,
          queryFn: async () => {
            return getAllMetersWithStatus(
              1,
              pageSize,
              status,
            );
          },
          staleTime: 1000 * 60 * 5,
        });
      });
    }
  }, [
    statusFilter,
    isLoading,
    searchTerm,
    typeFilter,
    startDateStr,
    endDateStr,
    pageSize,
    queryClient,
  ]);

  // Function to manually invalidate cache and refetch
  const invalidateAndRefetch = useCallback(
    async (options?: { throwOnError?: boolean }) => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.allMeters],
      });

      return refetch({
        cancelRefetch: false,
        throwOnError: options?.throwOnError ?? false,
      });
    },
    [queryClient, refetch],
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handleStatusFilterChange = (newStatus: MeterStatusFilter) => {
    setStatusFilter(newStatus);
    setPage(1); // Reset to first page when changing filter
  };

  const handleTypeFilterChange = (newType: MeterTypeFilter) => {
    setTypeFilter(newType);
    setPage(1); // Reset to first page when changing filter
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setPage(1); // Reset to first page when searching
  };

  const handleDateRangeChange = (newRange: DateRangeValue) => {
    setDateRange(newRange);
    setSelectedDate(null);
    setPage(1); // Reset to first page when changing date range
  };

  const handleSelectedDateChange = (newDate: CalendarDate | null) => {
    setSelectedDate(newDate);
    setDateRange(null);
    setPage(1); // Reset to first page when selecting a date
  };

  const handleClearFilters = () => {
    setTypeFilter(null);
    setDateRange(null);
    setSelectedDate(null);
    setPage(1);
  };

  return {
    meters: data?.meters || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    isFetching,
    error,
    refetch: invalidateAndRefetch, // Use our enhanced refetch function
    pagination: {
      page,
      pageSize,
      totalPages: Math.ceil((data?.totalCount || 0) / pageSize),
      handlePageChange,
      handlePageSizeChange,
    },
    filters: {
      statusFilter,
      typeFilter,
      searchTerm,
      dateRange,
      selectedDate,
      hasActiveFilters: Boolean(typeFilter || dateRange || selectedDate),
      handleStatusFilterChange,
      handleTypeFilterChange,
      handleSearchChange,
      handleDateRangeChange,
      handleSelectedDateChange,
      handleClearFilters,
    },
  };
}
