"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  useAgentTransactions,
  getAllTransactionsForExport,
  type TransactionFilters,
} from "@/components/agents/hooks/useAgentTransactions";
import { formatDateTimeShort } from "@/lib/utils/dateUtils";
import Loader from "@/components/ui/Loader";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone } from "@internationalized/date";

import {
  HistoryFiltersBar,
  HistoryPagination,
  ITEMS_PER_PAGE,
} from "@/components/agents/history";
import type {
  HistoryFilters,
  TransactionInfo,
} from "@/components/agents/history";
import StoreHistoryTable from "./StoreHistoryTable";
import StoreHistoryMobileList from "./StoreHistoryMobileList";
import TransactionMetersDialog from "@/components/sharedcomponents/TransactionMetersDialog";

const capitalizeMeterType = (type: string) => {
  if (type === "3 phase") return "3 Phase";
  return type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface StoreHistoryProps {
  readonly storeId: string;
}

/**
 * StoreHistory component - shows transaction history for a specific store.
 * Simplified version of AgentHistory with store pre-selected.
 */
export default function StoreHistory({ storeId }: Readonly<StoreHistoryProps>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [transactionType, setTransactionType] = useState<string | undefined>();
  const [meterType, setMeterType] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<{
    start: DateValue;
    end: DateValue;
  } | null>(null);
  const [singleDate, setSingleDate] = useState<DateValue | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Dialog state for viewing meter serial numbers
  const [metersDialogOpen, setMetersDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionInfo | null>(null);

  // Convert DateValue to Date for filters
  const getDateFromValue = (value: DateValue | undefined | null) => {
    if (!value) return undefined;
    return value.toDate(getLocalTimeZone());
  };

  // Build filters object for the query - always filter by storeId
  const queryFilters: TransactionFilters = {
    transactionType,
    meterType,
    agentId: storeId, // Always filter by this store
    startDate: singleDate
      ? getDateFromValue(singleDate)
      : getDateFromValue(dateRange?.start),
    endDate: singleDate
      ? getDateFromValue(singleDate)
      : getDateFromValue(dateRange?.end),
  };

  // useAgentTransactions expects (page, limit, searchTerm, filters)
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAgentTransactions(currentPage, ITEMS_PER_PAGE, searchTerm, queryFilters);

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  // Only show full loading state on initial load, not when we already have data
  // isLoading is true only when there's no cached data AND a fetch is in progress
  const showFullLoader = isLoading && !data;

  // UI filters object for the HistoryFiltersBar
  const uiFilters: HistoryFilters = {
    transactionType,
    meterType,
    selectedAgentId: storeId,
    dateRange,
    singleDate,
    searchTerm,
  };

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleTransactionTypeChange = useCallback(
    (value: string | undefined) => {
      setTransactionType(value);
      setCurrentPage(1);
    },
    []
  );

  const handleMeterTypeChange = useCallback((value: string | undefined) => {
    setMeterType(value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback(
    (value: { start: DateValue; end: DateValue } | null) => {
      setDateRange(value);
      setSingleDate(null);
      setCurrentPage(1);
    },
    []
  );

  const handleSingleDateChange = useCallback((value: DateValue | null) => {
    setSingleDate(value);
    setDateRange(null);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setTransactionType(undefined);
    setMeterType(undefined);
    setDateRange(null);
    setSingleDate(null);
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleQuantityClick = useCallback((info: TransactionInfo) => {
    setSelectedTransaction(info);
    setMetersDialogOpen(true);
  }, []);

  // Export functions
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const allTransactions = await getAllTransactionsForExport(
        searchTerm,
        queryFilters
      );
      if (allTransactions.length === 0) {
        toast.error("No transactions to export");
        return;
      }

      const exportData = allTransactions.map((t) => ({
        Date: formatDateTimeShort(t.transaction_date),
        Type: t.transaction_type === "assignment" ? "Assigned" : "Returned",
        "Meter Type": capitalizeMeterType(t.meter_type),
        Quantity: t.quantity,
      }));

      generateCSV(
        exportData,
        `store-transactions-${new Date().toISOString().split("T")[0]}`
      );
      toast.success(`Exported ${exportData.length} transactions`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXLSX = async () => {
    setIsExporting(true);
    try {
      const allTransactions = await getAllTransactionsForExport(
        searchTerm,
        queryFilters
      );
      if (allTransactions.length === 0) {
        toast.error("No transactions to export");
        return;
      }

      const exportData = allTransactions.map((t) => ({
        Date: formatDateTimeShort(t.transaction_date),
        Type: t.transaction_type === "assignment" ? "Assigned" : "Returned",
        "Meter Type": capitalizeMeterType(t.meter_type),
        Quantity: t.quantity,
      }));

      generateXLSX(
        exportData,
        `store-transactions-${new Date().toISOString().split("T")[0]}`,
        "Transactions"
      );
      toast.success(`Exported ${exportData.length} transactions`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const allTransactions = await getAllTransactionsForExport(
        searchTerm,
        queryFilters
      );
      if (allTransactions.length === 0) {
        toast.error("No transactions to export");
        return;
      }

      const headers = ["Date", "Type", "Meter Type", "Quantity"];
      const pdfData = allTransactions.map((t) => [
        formatDateTimeShort(t.transaction_date),
        t.transaction_type === "assignment" ? "Assigned" : "Returned",
        capitalizeMeterType(t.meter_type),
        String(t.quantity),
      ]);

      const blob = await pdf(
        <TableReportPDF
          title='Store Transaction History'
          headers={headers}
          data={pdfData}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `store-transactions-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allTransactions.length} transactions`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  if (showFullLoader) {
    return (
      <div className='flex justify-center py-8'>
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='text-center py-8 text-red-500'>
        Error loading transactions: {error?.message}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <HistoryFiltersBar
        filters={uiFilters}
        agents={[]}
        onSearchChange={handleSearchChange}
        onTransactionTypeChange={handleTransactionTypeChange}
        onMeterTypeChange={handleMeterTypeChange}
        onAgentChange={() => {}}
        onDateRangeChange={handleDateRangeChange}
        onSingleDateChange={handleSingleDateChange}
        onClearFilters={clearFilters}
        totalCount={pagination.total}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        onExportCSV={handleExportCSV}
        onExportXLSX={handleExportXLSX}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
        hasTransactions={transactions.length > 0}
        hideAgentFilter
        hideSearch
      />

      {/* Desktop Table */}
      <div className='hidden md:block'>
        <StoreHistoryTable
          transactions={transactions}
          onQuantityClick={handleQuantityClick}
        />
      </div>

      {/* Mobile List */}
      <div className='block md:hidden'>
        <StoreHistoryMobileList
          transactions={transactions}
          onQuantityClick={handleQuantityClick}
        />
      </div>

      {/* Pagination */}
      <HistoryPagination
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {transactions.length === 0 && !isLoading && (
        <div className='text-center py-8 text-gray-500'>
          No transactions found for this store
        </div>
      )}

      <TransactionMetersDialog
        open={metersDialogOpen}
        onOpenChange={setMetersDialogOpen}
        transactionInfo={selectedTransaction}
      />
    </div>
  );
}
