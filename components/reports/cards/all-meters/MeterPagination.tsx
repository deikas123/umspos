import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type MeterPaginationProps = Readonly<{
  pagination: {
    page: number;
    totalPages: number;
    handlePageChange: (page: number) => void;
  };
}>;

export function MeterPagination({ pagination }: MeterPaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className='flex justify-end mt-4'>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => pagination.handlePageChange(pagination.page - 1)}
              className={
                pagination.page === 1
                  ? "opacity-50 pointer-events-none"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {/* First page */}
          {pagination.page > 2 && (
            <PaginationItem>
              <PaginationLink
                onClick={() => pagination.handlePageChange(1)}
                className='cursor-pointer'>
                1
              </PaginationLink>
            </PaginationItem>
          )}

          {/* Ellipsis if needed */}
          {pagination.page > 3 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* Previous page if not on first page */}
          {pagination.page > 1 && (
            <PaginationItem>
              <PaginationLink
                onClick={() => pagination.handlePageChange(pagination.page - 1)}
                className='cursor-pointer'>
                {pagination.page - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {/* Current page */}
          <PaginationItem>
            <PaginationLink isActive>{pagination.page}</PaginationLink>
          </PaginationItem>

          {/* Next page if not on last page */}
          {pagination.page < pagination.totalPages && (
            <PaginationItem>
              <PaginationLink
                onClick={() => pagination.handlePageChange(pagination.page + 1)}
                className='cursor-pointer'>
                {pagination.page + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {/* Ellipsis if needed */}
          {pagination.page < pagination.totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* Last page */}
          {pagination.page < pagination.totalPages - 1 && (
            <PaginationItem>
              <PaginationLink
                onClick={() =>
                  pagination.handlePageChange(pagination.totalPages)
                }
                className='cursor-pointer'>
                {pagination.totalPages}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => pagination.handlePageChange(pagination.page + 1)}
              className={
                pagination.page === pagination.totalPages
                  ? "opacity-50 pointer-events-none"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
