import type { DateValue } from "@internationalized/date";

export interface Agent {
  id: string | number;
  name: string;
}

export interface Transaction {
  id: string | number;
  transaction_date: string | Date | null;
  agent_name: string | null;
  transaction_type: string;
  meter_type: string;
  quantity: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HistoryFilters {
  transactionType: string | undefined;
  meterType: string | undefined;
  selectedAgentId: string | undefined;
  dateRange: { start: DateValue; end: DateValue } | null;
  singleDate: DateValue | null;
  searchTerm: string;
}

export interface HistoryFiltersBarProps {
  filters: HistoryFilters;
  agents: Agent[];
  onSearchChange: (value: string) => void;
  onTransactionTypeChange: (value: string | undefined) => void;
  onMeterTypeChange: (value: string | undefined) => void;
  onAgentChange: (value: string | undefined) => void;
  onDateRangeChange: (
    value: { start: DateValue; end: DateValue } | null
  ) => void;
  onSingleDateChange: (value: DateValue | null) => void;
  onClearFilters: () => void;
  totalCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onExportPDF: () => void;
  isExporting: boolean;
  hasTransactions: boolean;
}

export interface HistoryTableProps {
  transactions: Transaction[];
}

export interface HistoryMobileListProps {
  transactions: Transaction[];
}

export interface HistoryPaginationProps {
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface AgentFilterSelectProps {
  agents: Agent[];
  selectedAgentId: string | undefined;
  onAgentChange: (value: string | undefined) => void;
}
