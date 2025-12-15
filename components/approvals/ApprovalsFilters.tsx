"use client";

import {
  Filter,
  X,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { METER_TYPES, STATUS_OPTIONS } from "./types";

interface ApprovalsFiltersProps {
  filterSearch: string;
  filterRequestedBy: string;
  filterMeterType: string;
  filterRecipient: string;
  filterStatus: string;
  hasActiveFilters: boolean;
  onFilterSearchChange: (value: string) => void;
  onFilterRequestedByChange: (value: string) => void;
  onFilterMeterTypeChange: (value: string) => void;
  onFilterRecipientChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onClearFilters: () => void;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onExportPDF: () => void;
}

export function ApprovalsFilters({
  filterSearch,
  filterRequestedBy,
  filterMeterType,
  filterRecipient,
  filterStatus,
  hasActiveFilters,
  onFilterSearchChange,
  onFilterRequestedByChange,
  onFilterMeterTypeChange,
  onFilterRecipientChange,
  onFilterStatusChange,
  onClearFilters,
  onExportCSV,
  onExportXLSX,
  onExportPDF,
}: Readonly<ApprovalsFiltersProps>) {
  return (
    <div className='flex flex-wrap items-center justify-center gap-3'>
      {/* Search Input */}
      <div className='relative'>
        <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search reason...'
          value={filterSearch}
          onChange={(e) => onFilterSearchChange(e.target.value)}
          className='pl-8 w-[160px]'
        />
      </div>

      {/* Requested By Input */}
      <div className='relative'>
        <Filter className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Requester...'
          value={filterRequestedBy}
          onChange={(e) => onFilterRequestedByChange(e.target.value)}
          className='pl-8 w-[140px]'
        />
      </div>

      {/* Recipient Input */}
      <div className='relative'>
        <Filter className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Recipient...'
          value={filterRecipient}
          onChange={(e) => onFilterRecipientChange(e.target.value)}
          className='pl-8 w-[140px]'
        />
      </div>

      {/* Meter Type Filter - Static options */}
      <Select value={filterMeterType} onValueChange={onFilterMeterTypeChange}>
        <SelectTrigger className='w-[140px]'>
          <SelectValue placeholder='Meter Type' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Types</SelectItem>
          {METER_TYPES.map((type) => (
            <SelectItem key={type} value={type.toLowerCase()}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger className='w-[130px]'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Status</SelectItem>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button variant='ghost' size='sm' onClick={onClearFilters}>
          <X className='h-4 w-4 mr-1' />
          Clear
        </Button>
      )}

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={onExportCSV}>
            <File className='h-4 w-4 mr-2' />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportXLSX}>
            <FileSpreadsheet className='h-4 w-4 mr-2' />
            Export as XLSX
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPDF}>
            <FileText className='h-4 w-4 mr-2' />
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
