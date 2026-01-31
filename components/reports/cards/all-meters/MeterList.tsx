import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Package } from "lucide-react";
import { MeterWithStatus } from "@/lib/actions/exports";
import { getMeterTypeBadgeClass } from "../../utils/meterTypeConfig";
import { MeterDetails } from "./MeterDetails";
import { MeterPagination } from "./MeterPagination";

type MeterListProps = Readonly<{
  meters: MeterWithStatus[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  pagination: {
    page: number;
    totalPages: number;
    handlePageChange: (page: number) => void;
  };
}>;

// Skeleton loader component
const TABLE_SKELETON_ITEMS = [1, 2, 3, 4, 5];
const CARD_SKELETON_ITEMS = [1, 2, 3];

const TableSkeleton = () => (
  <div className='space-y-3'>
    <div className='flex items-center space-x-4'>
      <Skeleton className='h-8 w-[250px]' />
      <Skeleton className='h-8 w-[100px]' />
    </div>
    {TABLE_SKELETON_ITEMS.map((id) => (
      <div key={`table-skeleton-${id}`} className='flex items-center space-x-4'>
        <Skeleton className='h-12 w-full' />
      </div>
    ))}
  </div>
);

const CardSkeleton = () => (
  <div className='space-y-4'>
    {CARD_SKELETON_ITEMS.map((id) => (
      <Card key={`card-skeleton-${id}`} className='p-4'>
        <div className='space-y-3'>
          <div className='flex justify-between'>
            <Skeleton className='h-5 w-[120px]' />
            <Skeleton className='h-5 w-[80px]' />
          </div>
          <Skeleton className='h-4 w-[180px]' />
          <Skeleton className='h-4 w-full' />
        </div>
      </Card>
    ))}
  </div>
);

export function MeterList({
  meters,
  isLoading,
  error,
  refetch,
  pagination,
}: MeterListProps) {
  if (isLoading) {
    return (
      <div>
        {/* Mobile skeleton */}
        <div className='md:hidden'>
          <CardSkeleton />
        </div>
        {/* Desktop skeleton */}
        <div className='hidden md:block'>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col justify-center items-center h-64'>
        <AlertCircle className='h-8 w-8 text-red-500 mb-2' />
        <p className='text-red-500'>Error loading meters</p>
        <Button
          variant='outline'
          size='sm'
          className='mt-2 cursor-pointer'
          onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (meters.length === 0) {
    return (
      <div className='flex flex-col justify-center items-center h-64'>
        <Package className='h-8 w-8 text-gray-400 mb-2' />
        <p className='text-gray-500'>No meters found</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile view */}
      <div className='md:hidden space-y-4'>
        {meters.map((meter) => (
          <Card key={meter.serial_number} className='p-4'>
            <div className='flex justify-between items-start'>
              <div>
                <p className='font-medium'>{meter.serial_number}</p>
                <Badge className={getMeterTypeBadgeClass(meter.type)}>
                  {meter.type}
                </Badge>
              </div>
            </div>
            <MeterDetails meter={meter} />
          </Card>
        ))}
      </div>

      {/* Desktop view */}
      <div className='hidden md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meters.map((meter) => (
              <TableRow key={meter.serial_number}>
                <TableCell className='font-medium'>
                  {meter.serial_number}
                </TableCell>
                <TableCell>
                  <Badge className={getMeterTypeBadgeClass(meter.type)}>
                    {meter.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <MeterDetails meter={meter} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meters.length > 0 && <MeterPagination pagination={pagination} />}
    </>
  );
}
