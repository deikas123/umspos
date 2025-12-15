"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dateUtils";
import { getPendingUpdateRequestBatchIds } from "@/lib/actions/sale-updates";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AddNoteDialog } from "./AddNoteDialog";
import { EditSaleDialog } from "./EditSaleDialog";
import GenerateReceiptDialog from "./GenerateReceiptDialog";
import { useMeterSalesData } from "./hooks/useMeterSalesData";
import type { SaleBatch, SaleBatchesResponse } from "./hooks/useMeterSalesData";
import { MeterSalesEmptyState } from "./meter-sales/MeterSalesEmptyState";
import { MeterSalesFilterBar } from "./meter-sales/MeterSalesFilterBar";
import { MeterSalesHeader } from "./meter-sales/MeterSalesHeader";
import { MeterSalesPagination } from "./meter-sales/MeterSalesPagination";
import { MeterSalesTable } from "./meter-sales/MeterSalesTable";
import { useMeterSalesExport } from "./meter-sales/useMeterSalesExport";
import { useMeterSalesFilters } from "./meter-sales/useMeterSalesFilters";
import { useNoteDialogState } from "./meter-sales/useNoteDialogState";
import { useMeterSalesSelection } from "./meter-sales/useMeterSalesSelection";

const ITEMS_PER_PAGE = 10;

interface MeterSalesProps {
  readonly initialData?: SaleBatchesResponse;
}

export default function MeterSales({ initialData }: MeterSalesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const filtersState = useMeterSalesFilters();
  const { filters, hasActiveFilters, clearFilters } = filtersState;

  const {
    saleBatches,
    pagination,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useMeterSalesData(currentPage, ITEMS_PER_PAGE, filters, initialData);

  // Fetch pending update request batch IDs
  const {
    data: pendingRequestBatchIds = [],
    refetch: refetchPendingRequestBatchIds,
  } = useQuery({
    queryKey: ["pendingUpdateRequestBatchIds"],
    queryFn: getPendingUpdateRequestBatchIds,
    staleTime: 1000 * 60, // 1 minute
  });

  const {
    selectedBatchId,
    toggleBatchSelection,
    handleSheetOpenChange,
    resetSelection,
  } = useMeterSalesSelection();
  const noteDialog = useNoteDialogState();

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEditBatch, setSelectedEditBatch] = useState<SaleBatch | null>(
    null
  );

  const handleOpenEditDialog = useCallback((batch: SaleBatch) => {
    setSelectedEditBatch(batch);
    setEditDialogOpen(true);
  }, []);

  const handleEditDialogClose = useCallback((open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setSelectedEditBatch(null);
    }
  }, []);

  const handleEditSuccess = useCallback(async () => {
    await Promise.all([refetch(), refetchPendingRequestBatchIds()]);
  }, [refetch, refetchPendingRequestBatchIds]);

  useEffect(() => {
    setCurrentPage(1);
    resetSelection();
  }, [filters, resetSelection]);

  const isRefreshing = isFetching && !isLoading;

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetch({ throwOnError: true }),
        refetchPendingRequestBatchIds(),
      ]);
      toast.success("Sales data refreshed");
    } catch (err) {
      console.error("Failed to refresh sales data:", err);
      toast.error("Failed to refresh sales data");
    }
  };

  const currentBatches = saleBatches;
  const totalPages = pagination.totalPages;

  const { handleExportPDF, handleExportCSV, handleExportXLSX, isExporting } =
    useMeterSalesExport(currentBatches, {
      formatDate,
      filters,
    });

  const handleOpenNoteDialog = (batch: SaleBatch) => {
    noteDialog.openDialog(batch);
  };

  const handleNoteSuccess = async () => {
    await refetch();
  };

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <div className='text-lg text-red-500'>Error: {error?.message}</div>
        <Button
          onClick={() => refetch()}
          variant='outline'
          className='cursor-pointer'>
          <RefreshCw className='mr-2 h-4 w-4' />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='w-full h-full'>
      <div className='flex flex-col items-center gap-6 mb-6'>
        <h1 className='text-2xl md:text-3xl font-bold text-center drop-shadow-lg'>
          Sales
        </h1>
      </div>

      <MeterSalesFilterBar
        searchUser={filtersState.searchUser}
        selectedType={filtersState.selectedType}
        selectedCustomerType={filtersState.selectedCustomerType}
        dateRange={filtersState.dateRange}
        selectedDate={filtersState.selectedDate}
        hasActiveFilters={hasActiveFilters}
        isExporting={isExporting}
        onSearchUserChange={filtersState.setSearchUser}
        onMeterTypeChange={filtersState.setSelectedType}
        onCustomerTypeChange={filtersState.setSelectedCustomerType}
        onDateRangeChange={filtersState.setDateRange}
        onSelectedDateChange={filtersState.setSelectedDate}
        onClearFilters={clearFilters}
        onExportCSV={handleExportCSV}
        onExportXLSX={handleExportXLSX}
        onExportPDF={handleExportPDF}
      />

      <Card className='w-full transition-all duration-200 ease-linear'>
        <MeterSalesHeader
          actions={<GenerateReceiptDialog />}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          disableRefresh={isLoading}
        />
        <CardContent className='relative p-0 md:p-6 -mt-0 md:-mt-8'>
          {isFetching && !isLoading && (
            <div className='absolute inset-0 flex items-center justify-center bg-white/70 z-10'>
              <Loader />
            </div>
          )}
          {currentBatches.length ? (
            <MeterSalesTable
              batches={currentBatches}
              selectedBatchId={selectedBatchId}
              pendingRequestBatchIds={pendingRequestBatchIds}
              onToggleBatch={toggleBatchSelection}
              onSheetOpenChange={handleSheetOpenChange}
              onOpenNoteDialog={handleOpenNoteDialog}
              onOpenEditDialog={handleOpenEditDialog}
              formatDate={formatDate}
            />
          ) : (
            <MeterSalesEmptyState message='No sales data available' />
          )}
        </CardContent>
      </Card>

      <MeterSalesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {noteDialog.selectedBatch && (
        <AddNoteDialog
          batchId={noteDialog.selectedBatch.id}
          existingNote={noteDialog.selectedBatch.notes}
          open={noteDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              noteDialog.resetDialog();
            }
          }}
          onSuccess={async () => {
            await handleNoteSuccess();
            noteDialog.resetDialog();
          }}
        />
      )}

      {selectedEditBatch && (
        <EditSaleDialog
          batch={selectedEditBatch}
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
