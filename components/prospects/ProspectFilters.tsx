"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { STATUS_LABELS } from "./types";
import { type ProspectStatus } from "@/lib/actions/prospects";

interface ProspectFiltersProps {
  readonly searchTerm: string;
  readonly onSearchChange: (value: string) => void;
  readonly statusFilter: ProspectStatus | "all";
  readonly onStatusChange: (value: ProspectStatus | "all") => void;
  readonly salesPersonFilter?: string;
  readonly onSalesPersonChange?: (value: string) => void;
  readonly salesPersons?: readonly string[];
  readonly showSalesPersonFilter?: boolean;
}

export function ProspectFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  salesPersonFilter,
  onSalesPersonChange,
  salesPersons = [],
  showSalesPersonFilter = false,
}: ProspectFiltersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className='flex flex-col md:flex-row gap-3 py-3'>
      <div className='flex-1 relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
        <Input
          placeholder='Search by client, location, or contact...'
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-10'
        />
      </div>
      <div className='flex gap-2'>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusChange(value as ProspectStatus | "all")
          }>
          <SelectTrigger className='w-[160px]'>
            <Filter className='h-4 w-4 mr-2' />
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showSalesPersonFilter && onSalesPersonChange && (
          <Select value={salesPersonFilter} onValueChange={onSalesPersonChange}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Sales Person' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Sales Persons</SelectItem>
              {salesPersons.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
