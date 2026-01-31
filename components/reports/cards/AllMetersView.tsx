import React from "react";
import { useMetersData, MeterStatusFilter } from "../hooks/useMetersData";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MeterSearch } from "./all-meters/MeterSearch";
import { MeterExport } from "./all-meters/MeterExport";
import { MeterFilters } from "./all-meters/MeterFilters";
import { MeterList } from "./all-meters/MeterList";

const AllMetersView: React.FC = () => {
  const { meters, isLoading, isFetching, error, pagination, filters, refetch } =
    useMetersData(25);

  const handleRefresh = async () => {
    try {
      await refetch({ throwOnError: true });
      toast.success("Meter data has been refreshed");
    } catch (error) {
      console.error("Failed to refresh meter data:", error);
      toast.error("Failed to refresh meter data");
    }
  };

  const isRefreshing = isFetching && !isLoading;

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <div className='flex-none bg-gray-50 pb-4 pt-2 px-6 border-b border-gray-200'>
        <div className='flex justify-between items-center mb-4 pr-12'>
          <h2 className='text-2xl font-bold'>All Meters</h2>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              aria-label='Refresh meter data'
              className='cursor-pointer'>
              <RefreshCw
                className={cn(
                  "h-4 w-4 mr-2 transition-transform",
                  (isLoading || isRefreshing) && "animate-spin",
                )}
              />
              Refresh
            </Button>

            {/* Advanced Search Input */}
            <MeterSearch filters={filters} />

            {/* Export Menu */}
            <MeterExport filters={filters} isLoading={isLoading} />
          </div>
        </div>

        <Tabs
          defaultValue='in_stock'
          className='w-full'
          value={filters.statusFilter}
          onValueChange={(value) => {
            filters.handleStatusFilterChange(value as MeterStatusFilter);
          }}>
          <MeterFilters filters={filters} />
        </Tabs>
      </div>

      <div className='flex-1 overflow-y-auto px-6 py-4'>
        <Tabs
          defaultValue='in_stock'
          className='w-full'
          value={filters.statusFilter}
          onValueChange={(value) => {
            filters.handleStatusFilterChange(value as MeterStatusFilter);
          }}>
          {/* Content for each tab */}
          {["in_stock", "with_agent", "sold", "replaced", "faulty"].map(
            (status) => (
              <TabsContent key={status} value={status} className='mt-0'>
                <MeterList
                  meters={meters}
                  isLoading={isLoading}
                  error={error}
                  refetch={refetch}
                  pagination={pagination}
                />
              </TabsContent>
            ),
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AllMetersView;
