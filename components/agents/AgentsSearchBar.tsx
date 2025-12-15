"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  RefreshCw,
  Download,
  FileText,
  FileSpreadsheet,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Meter types for breakdown
const METER_TYPES = [
  { key: "integrated", label: "Integrated" },
  { key: "split", label: "Split" },
  { key: "gas", label: "Gas" },
  { key: "water", label: "Water" },
  { key: "smart", label: "Smart" },
  { key: "3 phase", label: "3 Phase" },
] as const;

interface Agent {
  id: string;
  name: string;
  phone_number: string;
  location: string;
  county: string;
  is_active: boolean | null;
  total_meters?: number;
}

interface AgentsSearchBarProps {
  searchTerm: string;
  totalAgents: number;
  agents: Agent[];
  meterCounts?: Record<string, number>;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onExportPDF: () => void;
  isExporting?: boolean;
}

export default function AgentsSearchBar({
  searchTerm,
  totalAgents,
  agents,
  meterCounts = {},
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  onExportCSV,
  onExportXLSX,
  onExportPDF,
  isExporting = false,
}: Readonly<AgentsSearchBarProps>) {
  // Calculate total meters
  const totalMeters = useMemo(() => {
    return agents.reduce((sum, agent) => sum + (agent.total_meters ?? 0), 0);
  }, [agents]);

  return (
    <div className='mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
      <div className='relative w-full sm:w-72'>
        <Search className='absolute left-2 top-2.5 h-4 w-4 text-primary' />
        <Input
          placeholder='Search agents...'
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-8 border-[#000] focus:ring-primary'
        />
      </div>
      <div className='flex items-center gap-2 sm:gap-4'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='gap-2 cursor-pointer'
              disabled={isExporting || agents.length === 0}>
              <Download
                className={cn("h-4 w-4", isExporting && "animate-pulse")}
              />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={onExportCSV} className='cursor-pointer'>
              <FileText className='mr-2 h-4 w-4' />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportXLSX} className='cursor-pointer'>
              <FileSpreadsheet className='mr-2 h-4 w-4' />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF} className='cursor-pointer'>
              <FileText className='mr-2 h-4 w-4 text-red-500' />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant='outline'
          size='icon'
          onClick={onRefresh}
          className='hover:bg-gray-100 cursor-pointer'
          disabled={isRefreshing}>
          <RefreshCw
            className={cn(
              "h-4 w-4 transition-transform",
              isRefreshing && "animate-spin"
            )}
          />
        </Button>
        <div className='flex items-center gap-3 text-sm font-medium whitespace-nowrap'>
          <span className='text-primary'>{totalAgents} agents</span>
          <span className='text-gray-300'>|</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='flex items-center gap-1 text-primary cursor-pointer hover:text-primary/80 transition-colors'>
                  <Package className='h-3.5 w-3.5' />
                  {totalMeters.toLocaleString()} meters
                </span>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='p-3'>
                <div className='space-y-1.5'>
                  <p className='font-semibold text-sm border-b pb-1 mb-2'>
                    Meters by Type
                  </p>
                  {METER_TYPES.map((type) => {
                    const count = meterCounts[type.key.toLowerCase()] ?? 0;
                    return (
                      <div
                        key={type.key}
                        className='flex justify-between gap-4 text-sm'>
                        <span className='text-white'>
                          {type.label}:
                        </span>
                        <span className='font-medium'>
                          {count.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                  <div className='flex justify-between gap-4 text-sm border-t pt-1.5 mt-1.5'>
                    <span className='font-semibold'>Total:</span>
                    <span className='font-semibold'>
                      {totalMeters.toLocaleString()}
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
