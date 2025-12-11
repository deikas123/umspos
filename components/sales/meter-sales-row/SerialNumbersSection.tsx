import { Fragment } from "react";

import { Loader2, Search, Hash } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import type { SoldMeter } from "./types";

interface SerialNumbersSectionProps {
  loading: boolean;
  filteredMeters: SoldMeter[];
  totalMeters: number;
  currentMeters: SoldMeter[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  hasSearchTerm: boolean;
}

export function SerialNumbersSection({
  loading,
  filteredMeters,
  totalMeters,
  currentMeters,
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPreviousPage,
  hasSearchTerm,
}: SerialNumbersSectionProps) {
  if (loading) {
    return (
      <div className='bg-white rounded-xl border border-gray-200 p-12 shadow-sm'>
        <div className='flex flex-col items-center justify-center space-y-3'>
          <div className='w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-[#E46020]' />
          </div>
          <p className='text-sm text-gray-500'>Loading serial numbers...</p>
        </div>
      </div>
    );
  }

  if (filteredMeters.length === 0 && hasSearchTerm) {
    return (
      <div className='bg-white rounded-xl border border-gray-200 p-12 shadow-sm'>
        <div className='flex flex-col items-center justify-center space-y-3'>
          <div className='w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center'>
            <Search className='h-6 w-6 text-gray-400' />
          </div>
          <div className='text-center'>
            <p className='text-sm font-medium text-gray-900'>
              No results found
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              Try a different search term
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
      {/* Header */}
      <div className='px-4 py-3 border-b border-gray-100 bg-gray-50/50'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Hash className='h-4 w-4 text-gray-400' />
            <h3 className='text-sm font-semibold text-gray-900'>
              Serial Numbers
            </h3>
          </div>
          <span className='text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200'>
            {filteredMeters.length} of {totalMeters}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className='p-4'>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
          {currentMeters.map((meter, index) => (
            <div
              key={`${meter.serial_number}-${index}`}
              className='group px-3 py-2.5 bg-gray-50 hover:bg-[#E46020]/5 hover:border-[#E46020]/20 border border-transparent rounded-lg text-center font-mono text-sm text-gray-700 transition-all cursor-default'>
              {meter.serial_number}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='px-4 py-3 border-t border-gray-100 bg-gray-50/50'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(event) => {
                    event.preventDefault();
                    onPreviousPage();
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:bg-white"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, pages) => (
                  <Fragment key={page}>
                    {index > 0 && pages[index - 1] !== page - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={(event) => {
                          event.preventDefault();
                          onPageChange(page);
                        }}
                        isActive={currentPage === page}
                        className={`cursor-pointer ${currentPage === page ? "bg-[#E46020] text-white border-[#E46020] hover:bg-[#d45518]" : "hover:bg-white"}`}>
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </Fragment>
                ))}

              <PaginationItem>
                <PaginationNext
                  onClick={(event) => {
                    event.preventDefault();
                    onNextPage();
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:bg-white"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
