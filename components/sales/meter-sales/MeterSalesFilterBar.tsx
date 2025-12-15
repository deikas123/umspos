import { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Search,
  File,
  FileSpreadsheet,
  FileText,
  RotateCcw,
} from "lucide-react";

import { CUSTOMER_TYPES } from "@/lib/constants/locationData";
import { CalendarDate } from "@internationalized/date";

interface DateRangeValue {
  start: CalendarDate | null;
  end: CalendarDate | null;
}

interface MeterSalesFilterBarProps {
  searchUser: string;
  selectedType: string | null;
  selectedCustomerType: string | null;
  dateRange: DateRangeValue | null;
  selectedDate: CalendarDate | null;
  hasActiveFilters: boolean;
  isExporting?: boolean;
  onSearchUserChange: (value: string) => void;
  onMeterTypeChange: (value: string | null) => void;
  onCustomerTypeChange: (value: string | null) => void;
  onDateRangeChange: (value: DateRangeValue | null) => void;
  onSelectedDateChange: (value: CalendarDate | null) => void;
  onClearFilters: () => void;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onExportPDF: () => void;
}

export function MeterSalesFilterBar({
  searchUser,
  selectedType,
  selectedCustomerType,
  dateRange,
  selectedDate,
  hasActiveFilters,
  isExporting = false,
  onSearchUserChange,
  onMeterTypeChange,
  onCustomerTypeChange,
  onDateRangeChange,
  onSelectedDateChange,
  onClearFilters,
  onExportCSV,
  onExportXLSX,
  onExportPDF,
}: MeterSalesFilterBarProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchUserChange(event.target.value);
  };

  // Count active filters for badge
  const activeFilterCount = [
    selectedType,
    selectedCustomerType,
    dateRange?.start,
    selectedDate,
  ].filter(Boolean).length;

  return (
    <div className='mb-6'>
      <div className='bg-white rounded-xl border shadow-sm'>
        {/* Main Filter Row */}
        <div className='p-4 flex flex-wrap items-center gap-3'>
          {/* Search Input */}
          <div className='relative flex-1 min-w-[200px] max-w-[320px]'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
            <Input
              type='text'
              placeholder='Search seller or recipient...'
              value={searchUser}
              onChange={handleSearchChange}
              className='pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors'
            />
          </div>

          {/* Meter Type Select */}
          <Select
            value={selectedType || "all"}
            onValueChange={(value) =>
              onMeterTypeChange(value === "all" ? null : value)
            }>
            <SelectTrigger className='w-[140px] h-9 cursor-pointer bg-gray-50 border-gray-200'>
              <SelectValue placeholder='Meter Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='split'>Split</SelectItem>
              <SelectItem value='integrated'>Integrated</SelectItem>
              <SelectItem value='gas'>Gas</SelectItem>
              <SelectItem value='water'>Water</SelectItem>
              <SelectItem value='3 Phase'>3 Phase</SelectItem>
              <SelectItem value='Smart'>Smart</SelectItem>
            </SelectContent>
          </Select>

          {/* Customer Type Select */}
          <Select
            value={selectedCustomerType || "all"}
            onValueChange={(value) =>
              onCustomerTypeChange(value === "all" ? null : value)
            }>
            <SelectTrigger className='w-[150px] h-9 cursor-pointer bg-gray-50 border-gray-200'>
              <SelectValue placeholder='Customer Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Customers</SelectItem>
              {CUSTOMER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filters */}
          <div className='flex items-center gap-2'>
            <div className='w-[150px]'>
              <DatePicker
                value={selectedDate}
                onChange={onSelectedDateChange}
                label='Date'
              />
            </div>

            <div className='w-[270px]'>
              <DateRangePicker
                value={dateRange}
                onChange={onDateRangeChange}
                label='Date range'
              />
            </div>
          </div>

          {/* Spacer */}
          <div className='flex-1' />

          {/* Actions */}
          <div className='flex items-center gap-2'>
            {hasActiveFilters && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onClearFilters}
                className='h-9 px-3 text-gray-500 hover:text-gray-700'>
                <RotateCcw className='h-3.5 w-3.5 mr-1.5' />
                Reset
                {activeFilterCount > 0 && (
                  <span className='ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 rounded-full'>
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-9 px-4 border-[#000080]/20 text-[#000080] hover:bg-[#000080]/5 hover:text-[#000080]'
                  disabled={isExporting}>
                  <Download className='h-4 w-4 mr-2' />
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-44'>
                <DropdownMenuLabel className='text-xs text-gray-500'>
                  Export Format
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onExportCSV}
                  disabled={isExporting}
                  className='cursor-pointer'>
                  <File className='mr-2 h-4 w-4 text-green-600' />
                  CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onExportXLSX}
                  disabled={isExporting}
                  className='cursor-pointer'>
                  <FileSpreadsheet className='mr-2 h-4 w-4 text-emerald-600' />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onExportPDF}
                  disabled={isExporting}
                  className='cursor-pointer'>
                  <FileText className='mr-2 h-4 w-4 text-red-600' />
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
