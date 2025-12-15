"use client";

import { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentFilterSelect } from "./AgentFilterSelect";
import { METER_TYPES, TRANSACTION_TYPES } from "./constants";
import type { HistoryFiltersBarProps } from "./types";

const capitalizeMeterType = (type: string) => {
  if (type === "3 phase") return "3 Phase";
  return type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const HistoryFiltersBar = memo(function HistoryFiltersBar({
  filters,
  agents,
  onSearchChange,
  onTransactionTypeChange,
  onMeterTypeChange,
  onAgentChange,
  onDateRangeChange,
  onSingleDateChange,
  onClearFilters,
  totalCount,
  onRefresh,
  isRefreshing,
  onExportCSV,
  onExportXLSX,
  onExportPDF,
  isExporting,
  hasTransactions,
}: Readonly<HistoryFiltersBarProps>) {
  const hasActiveFilters =
    filters.transactionType ||
    filters.meterType ||
    filters.selectedAgentId ||
    filters.dateRange ||
    filters.singleDate ||
    filters.searchTerm;

  return (
    <div className='flex flex-col gap-4'>
      {/* Row 1: Search and Actions */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div className='relative flex-1 w-full sm:max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            type='text'
            placeholder='Search by agent name...'
            value={filters.searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='flex items-center gap-2'>
          <div className='text-sm text-gray-600'>
            Total: <span className='font-semibold'>{totalCount}</span>{" "}
            transactions
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={onRefresh}
            className='gap-2 cursor-pointer'
            disabled={isRefreshing}>
            <RefreshCw
              className={cn(
                "w-4 h-4 transition-transform",
                isRefreshing && "animate-spin"
              )}
            />
            Refresh
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='gap-2'
                disabled={isExporting || !hasTransactions}>
                <Download className='w-4 h-4' />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={onExportCSV}
                className='cursor-pointer'>
                <File className='w-4 h-4 mr-2' />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportXLSX}
                className='cursor-pointer'>
                <FileSpreadsheet className='w-4 h-4 mr-2' />
                Export as XLSX
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportPDF}
                className='cursor-pointer'>
                <FileText className='w-4 h-4 mr-2' />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: Filters */}
      <div className='flex flex-wrap gap-3 items-center'>
        {/* Transaction Type Filter */}
        <Select
          value={filters.transactionType || "all"}
          onValueChange={(value) => {
            onTransactionTypeChange(value === "all" ? undefined : value);
          }}>
          <SelectTrigger className='w-[160px]'>
            <SelectValue placeholder='Transaction Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Transactions</SelectItem>
            {TRANSACTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Meter Type Filter */}
        <Select
          value={filters.meterType || "all"}
          onValueChange={(value) => {
            onMeterTypeChange(value === "all" ? undefined : value);
          }}>
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='Meter Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Meters</SelectItem>
            {METER_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {capitalizeMeterType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Agent Filter with Search */}
        <AgentFilterSelect
          agents={agents}
          selectedAgentId={filters.selectedAgentId}
          onAgentChange={onAgentChange}
        />

        {/* Single Date Picker */}
        <DatePicker
          value={filters.singleDate}
          onChange={onSingleDateChange}
          label='Specific date'
        />

        {/* Date Range Picker */}
        <DateRangePicker
          value={filters.dateRange}
          onChange={onDateRangeChange}
          label='Date range'
        />

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onClearFilters}
            className='gap-1 text-gray-500 hover:text-gray-700'>
            <X className='w-4 h-4' />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
});
