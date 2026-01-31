import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MeterStatusFilter, DateRangeValue } from "../../hooks/useMetersData";
import { CalendarDate } from "@internationalized/date";

// Define meter types
const METER_TYPES = [
  "integrated",
  "split",
  "gas",
  "water",
  "smart",
  "3 phase",
] as const;

type MeterFiltersProps = Readonly<{
  filters: {
    statusFilter: string;
    typeFilter: string | null;
    dateRange: DateRangeValue;
    selectedDate: CalendarDate | null;
    hasActiveFilters: boolean;
    handleStatusFilterChange: (status: MeterStatusFilter) => void;
    handleTypeFilterChange: (type: string | null) => void;
    handleDateRangeChange: (value: DateRangeValue) => void;
    handleSelectedDateChange: (value: CalendarDate | null) => void;
    handleClearFilters: () => void;
  };
}>;

export function MeterFilters({ filters }: MeterFiltersProps) {
  return (
    <div className='flex justify-between items-center mb-4'>
      <TabsList>
        <TabsTrigger value='in_stock' className='cursor-pointer'>
          In Stock
        </TabsTrigger>
        <TabsTrigger value='with_agent' className='cursor-pointer'>
          With Agent
        </TabsTrigger>
        <TabsTrigger value='sold' className='cursor-pointer'>
          Sold
        </TabsTrigger>
        <TabsTrigger value='replaced' className='cursor-pointer'>
          Replaced
        </TabsTrigger>
        <TabsTrigger value='faulty' className='cursor-pointer'>
          Faulty
        </TabsTrigger>
      </TabsList>

      <div className='flex items-center gap-3'>
        <Select
          value={filters.typeFilter || ""}
          onValueChange={(value) => {
            filters.handleTypeFilterChange(value === "all" ? null : value);
          }}>
          <SelectTrigger className='w-[150px] cursor-pointer'>
            <SelectValue placeholder='All Types' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            {METER_TYPES.map((type: string) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className='w-[150px]'>
          <DatePicker
            value={filters.selectedDate}
            onChange={filters.handleSelectedDateChange}
            label='Date'
          />
        </div>

        <div className='w-[270px]'>
          <DateRangePicker
            value={filters.dateRange}
            onChange={filters.handleDateRangeChange}
            label='Date range'
          />
        </div>

        {filters.hasActiveFilters && (
          <Button
            variant='ghost'
            size='sm'
            onClick={filters.handleClearFilters}
            className='h-9 px-3 cursor-pointer text-gray-500 hover:text-gray-700'>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
