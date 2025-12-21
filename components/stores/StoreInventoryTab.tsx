"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Package, Search } from "lucide-react";
import { formatDate } from "@/lib/utils/dateUtils";
import { type MeterInventory } from "./hooks/useStoreInventory";

// Meter types for filtering
const METER_TYPES = [
  { key: "all", label: "All" },
  { key: "integrated", label: "Integrated" },
  { key: "split", label: "Split" },
  { key: "gas", label: "Gas" },
  { key: "water", label: "Water" },
  { key: "smart", label: "Smart" },
  { key: "3 phase", label: "3 Phase" },
] as const;

interface StoreInventoryTabProps {
  readonly filteredInventory: MeterInventory[];
  readonly paginatedInventory: MeterInventory[];
  readonly isLoadingInventory: boolean;
  readonly searchTerm: string;
  readonly activeTab: string;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly typeCounts: Record<string, number>;
  readonly onSearchChange: (value: string) => void;
  readonly onTabChange: (value: string) => void;
  readonly onPageChange: (page: number) => void;
}

export default function StoreInventoryTab({
  filteredInventory,
  paginatedInventory,
  isLoadingInventory,
  searchTerm,
  activeTab,
  currentPage,
  totalPages,
  typeCounts,
  onSearchChange,
  onTabChange,
  onPageChange,
}: StoreInventoryTabProps) {
  const renderEmptyState = () => (
    <div className='text-center py-8 text-gray-500'>
      <Package className='h-12 w-12 mx-auto mb-3 text-gray-300' />
      <p className='font-medium'>No meters in inventory</p>
      <p className='text-sm text-gray-400 mt-1'>
        {searchTerm || activeTab !== "all"
          ? "Try adjusting your filters"
          : "Assign meters to this store to see them here"}
      </p>
    </div>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className='flex justify-center'>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                className={cn(
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={page === currentPage}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(currentPage + 1, totalPages))
                }
                className={cn(
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      {/* Search */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Search by serial number...'
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className='pl-10'
          />
        </div>
      </div>

      {/* Type Filter Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className='flex-wrap h-auto gap-1'>
          {METER_TYPES.map((type) => (
            <TabsTrigger
              key={type.key}
              value={type.key}
              className='text-xs px-3'>
              {type.label}
              <Badge variant='secondary' className='ml-1.5 text-xs'>
                {typeCounts[type.key] || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Inventory Table */}
      {isLoadingInventory && (
        <div className='text-center py-8 text-gray-500'>
          Loading inventory...
        </div>
      )}
      {!isLoadingInventory &&
        filteredInventory.length === 0 &&
        renderEmptyState()}
      {!isLoadingInventory && filteredInventory.length > 0 && (
        <>
          <div className='border rounded-lg overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='bg-gray-50'>
                  <TableHead className='font-semibold'>Serial Number</TableHead>
                  <TableHead className='font-semibold'>Type</TableHead>
                  <TableHead className='font-semibold'>Assigned Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInventory.map((meter) => (
                  <TableRow key={meter.id}>
                    <TableCell className='font-mono font-medium'>
                      {meter.serial_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className='capitalize'>
                        {meter.type}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-gray-500'>
                      {meter.assigned_at
                        ? formatDate(meter.assigned_at)
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {renderPagination()}
        </>
      )}
    </div>
  );
}
