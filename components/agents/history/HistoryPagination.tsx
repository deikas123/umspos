"use client";

import { memo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import type { HistoryPaginationProps } from "./types";

export const HistoryPagination = memo(function HistoryPagination({
  pagination,
  currentPage,
  onPageChange,
}: Readonly<HistoryPaginationProps>) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className='mt-4 flex justify-center'>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              className={cn(
                "cursor-pointer",
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>

          {Array.from({ length: pagination.totalPages }).map((_, i) => {
            const page = i + 1;
            if (
              page === 1 ||
              page === pagination.totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={page === currentPage}
                    className='cursor-pointer'>
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
                onPageChange(Math.min(currentPage + 1, pagination.totalPages))
              }
              className={cn(
                "cursor-pointer",
                currentPage === pagination.totalPages &&
                  "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
});
