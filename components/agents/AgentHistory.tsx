"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  useAgentTransactions,
  TransactionFilters,
  getAllTransactionsForExport,
} from "./hooks/useAgentTransactions";
import { useAgentsData } from "./hooks/useAgentsData";
import { formatDateTimeShort, formatDate } from "@/lib/utils/dateUtils";
import Loader from "@/components/ui/Loader";
import { useDebounce } from "@/hooks/use-debounce";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone } from "@internationalized/date";

import {
  HistoryFiltersBar,
  HistoryTable,
  HistoryMobileList,
  HistoryPagination,
  ITEMS_PER_PAGE,
} from "./history";
import type { HistoryFilters, Agent, TransactionInfo } from "./history";
import TransactionMetersDialog from "@/components/sharedcomponents/TransactionMetersDialog";

const capitalizeMeterType = (type: string) => {
  if (type === "3 phase") return "3 Phase";
  return type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function AgentHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [transactionType, setTransactionType] = useState<string | undefined>();
  const [meterType, setMeterType] = useState<string | undefined>();
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
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

  // Get agents for filter dropdown
  const { agentsData } = useAgentsData();
  const agents: Agent[] = agentsData?.agents || [];

  // Convert DateValue to Date for filters
  const getDateFromValue = (value: DateValue | undefined | null) => {
    if (!value) return undefined;
    return value.toDate(getLocalTimeZone());
  };

  // Build filters object for the query
  const queryFilters: TransactionFilters = {
    transactionType,
    meterType,
    agentId: selectedAgentId,
    // If single date is set, use it as both start and end date
    startDate: singleDate
      ? getDateFromValue(singleDate)
      : getDateFromValue(dateRange?.start),
    endDate: singleDate
      ? getDateFromValue(singleDate)
      : getDateFromValue(dateRange?.end),
  };

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAgentTransactions(
      currentPage,
      ITEMS_PER_PAGE,
      debouncedSearchTerm,
      queryFilters,
    );

  // Combined filters for the UI component
  const uiFilters: HistoryFilters = {
    transactionType,
    meterType,
    selectedAgentId,
    dateRange,
    singleDate,
    searchTerm,
  };

  const handleRefresh = useCallback(async () => {
    try {
      await refetch({ cancelRefetch: false, throwOnError: true });
      toast.success("Transaction history refreshed");
    } catch (err) {
      console.error("Failed to refresh data:", err);
      toast.error("Failed to refresh data");
    }
  }, [refetch]);

  const isRefreshing = isFetching && !isLoading;

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleTransactionTypeChange = useCallback(
    (value: string | undefined) => {
      setTransactionType(value);
      setCurrentPage(1);
    },
    [],
  );

  const handleMeterTypeChange = useCallback((value: string | undefined) => {
    setMeterType(value);
    setCurrentPage(1);
  }, []);

  const handleAgentChange = useCallback((value: string | undefined) => {
    setSelectedAgentId(value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback(
    (value: { start: DateValue; end: DateValue } | null) => {
      setDateRange(value);
      // Clear single date when range is selected
      if (value) setSingleDate(null);
      setCurrentPage(1);
    },
    [],
  );

  const handleSingleDateChange = useCallback((value: DateValue | null) => {
    setSingleDate(value);
    // Clear date range when single date is selected
    if (value) setDateRange(null);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setTransactionType(undefined);
    setMeterType(undefined);
    setSelectedAgentId(undefined);
    setDateRange(null);
    setSingleDate(null);
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  // Export functions
  const formatTransactionForExport = useCallback(
    (transaction: any) => ({
      Date: transaction.transaction_date
        ? formatDateTimeShort(transaction.transaction_date)
        : "N/A",
      "Agent Name": transaction.agent_name || "Unknown Agent",
      "Transaction Type":
        transaction.transaction_type.charAt(0).toUpperCase() +
        transaction.transaction_type.slice(1),
      "Meter Type": capitalizeMeterType(transaction.meter_type),
      "Performed By": transaction.performed_by_name || "—",
      Quantity: transaction.quantity,
    }),
    [],
  );

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const allTransactions = await getAllTransactionsForExport(
        debouncedSearchTerm,
        queryFilters,
      );
      if (!allTransactions || allTransactions.length === 0) {
        toast.error("No data to export");
        return;
      }
      const exportData = allTransactions.map(formatTransactionForExport);
      generateCSV(exportData, "agent-history");
      toast.success(
        `CSV exported successfully (${allTransactions.length} records)`,
      );
    } catch (err) {
      console.error("Error exporting CSV:", err);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm, queryFilters, formatTransactionForExport]);

  const handleExportXLSX = useCallback(async () => {
    setIsExporting(true);
    try {
      const allTransactions = await getAllTransactionsForExport(
        debouncedSearchTerm,
        queryFilters,
      );
      if (!allTransactions || allTransactions.length === 0) {
        toast.error("No data to export");
        return;
      }
      const exportData = allTransactions.map(formatTransactionForExport);
      generateXLSX(exportData, "agent-history", "Agent History");
      toast.success(
        `XLSX exported successfully (${allTransactions.length} records)`,
      );
    } catch (err) {
      console.error("Error exporting XLSX:", err);
      toast.error("Failed to export XLSX file");
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm, queryFilters, formatTransactionForExport]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const allTransactions = await getAllTransactionsForExport(
        debouncedSearchTerm,
        queryFilters,
      );
      if (!allTransactions || allTransactions.length === 0) {
        toast.error("No data to export");
        return;
      }
      const headers = [
        "Date",
        "Agent Name",
        "Transaction Type",
        "Meter Type",
        "Performed By",
        "Quantity",
      ];

      const pdfData = allTransactions.map((t) => [
        t.transaction_date ? formatDateTimeShort(t.transaction_date) : "N/A",
        t.agent_name || "Unknown Agent",
        t.transaction_type.charAt(0).toUpperCase() +
          t.transaction_type.slice(1),
        capitalizeMeterType(t.meter_type),
        t.performed_by_name || "—",
        t.quantity.toString(),
      ]);

      const blob = await pdf(
        <TableReportPDF
          title='Agent Transaction History'
          headers={headers}
          data={pdfData}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agent-history-${formatDate(new Date())}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(
        `PDF exported successfully (${allTransactions.length} records)`,
      );
    } catch (err) {
      console.error("Error exporting PDF:", err);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm, queryFilters]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleQuantityClick = useCallback((info: TransactionInfo) => {
    setSelectedTransaction(info);
    setMetersDialogOpen(true);
  }, []);

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  const { transactions = [], pagination } = data || {
    transactions: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  };

  return (
    <div className='space-y-4'>
      <HistoryFiltersBar
        filters={uiFilters}
        agents={agents}
        onSearchChange={handleSearchChange}
        onTransactionTypeChange={handleTransactionTypeChange}
        onMeterTypeChange={handleMeterTypeChange}
        onAgentChange={handleAgentChange}
        onDateRangeChange={handleDateRangeChange}
        onSingleDateChange={handleSingleDateChange}
        onClearFilters={clearFilters}
        totalCount={pagination.total}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExportCSV={handleExportCSV}
        onExportXLSX={handleExportXLSX}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
        hasTransactions={transactions.length > 0}
      />

      {isLoading ? (
        <div className='relative flex items-center justify-center h-64'>
          <Loader />
        </div>
      ) : (
        <>
          <HistoryTable
            transactions={transactions}
            onQuantityClick={handleQuantityClick}
          />
          <HistoryMobileList
            transactions={transactions}
            onQuantityClick={handleQuantityClick}
          />
        </>
      )}

      <HistoryPagination
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <TransactionMetersDialog
        open={metersDialogOpen}
        onOpenChange={setMetersDialogOpen}
        transactionInfo={selectedTransaction}
      />
    </div>
  );
}
