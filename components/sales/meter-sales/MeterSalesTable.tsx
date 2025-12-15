import React from "react";
import { Pencil, Clock } from "lucide-react";

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

import { MeterSalesRow } from "../MeterSalesRow";
import { prefetchMeterSaleDetails } from "../meter-sales-row/useMeterSaleDetails";
import type { SaleBatch } from "../hooks/useMeterSalesData";

interface MeterSalesTableProps {
  batches: SaleBatch[];
  selectedBatchId: string | null;
  pendingRequestBatchIds?: string[];
  onToggleBatch: (batchId: string) => void;
  onSheetOpenChange: (batchId: string, open: boolean) => void;
  onOpenNoteDialog: (batch: SaleBatch) => void;
  onOpenEditDialog: (batch: SaleBatch) => void;
  formatDate: (date: Date | null) => string;
}

function MobileBatchCard({
  batch,
  isOpen,
  hasPendingRequest,
  onToggleBatch,
  onSheetOpenChange,
  onOpenNoteDialog,
  onOpenEditDialog,
  formatDate,
}: {
  batch: SaleBatch;
  isOpen: boolean;
  hasPendingRequest: boolean;
  onToggleBatch: (batchId: string) => void;
  onSheetOpenChange: (batchId: string, open: boolean) => void;
  onOpenNoteDialog: (batch: SaleBatch) => void;
  onOpenEditDialog: (batch: SaleBatch) => void;
  formatDate: (date: Date | null) => string;
}) {
  return (
    <div className='space-y-2'>
      <div className='relative'>
        <Button
          variant='ghost'
          size='icon'
          className='absolute top-2 right-2 z-10 h-8 w-8'
          onClick={(e) => {
            e.stopPropagation();
            onOpenEditDialog(batch);
          }}
          title={
            hasPendingRequest ? "View pending request" : "Edit sale record"
          }>
          {hasPendingRequest ? (
            <Clock className='h-4 w-4 text-amber-500' />
          ) : (
            <Pencil className='h-4 w-4' />
          )}
        </Button>
        <button
          type='button'
          className='w-full bg-white p-4 rounded-lg border shadow-sm space-y-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-blue-500'
          onClick={() => onToggleBatch(batch.id)}
          onMouseEnter={() => prefetchMeterSaleDetails(batch.id)}
          onFocus={() => prefetchMeterSaleDetails(batch.id)}
          onTouchStart={() => prefetchMeterSaleDetails(batch.id)}>
          <div className='flex justify-between items-start'>
            <div>
              <p className='font-medium'>{batch.user_name}</p>
              <p className='text-sm text-muted-foreground'>
                {formatDate(batch.sale_date)}
              </p>
            </div>
            <Badge variant='outline' className='bg-blue-100 mr-8'>
              {batch.customer_type
                ?.split(" ")
                .map(
                  (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
                )
                .join(" ")}
            </Badge>
          </div>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div>
              <p className='text-muted-foreground'>Meter Type</p>
              <p>{batch.meter_type}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Amount</p>
              <p>{batch.batch_amount}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Sale Amount</p>
              <p>KES {Math.round(batch.total_price).toLocaleString()}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>County</p>
              <Badge variant='outline' className='bg-green-100'>
                {batch.customer_county}
              </Badge>
            </div>
          </div>
        </button>
      </div>
      <MeterSalesRow
        batch={batch}
        isOpen={isOpen}
        onOpenChange={(open) => onSheetOpenChange(batch.id, open)}
        onOpenNoteDialog={onOpenNoteDialog}
      />
    </div>
  );
}

function DesktopBatchRow({
  batch,
  isOpen,
  hasPendingRequest,
  onToggleBatch,
  onSheetOpenChange,
  onOpenNoteDialog,
  onOpenEditDialog,
  formatDate,
}: {
  batch: SaleBatch;
  isOpen: boolean;
  hasPendingRequest: boolean;
  onToggleBatch: (batchId: string) => void;
  onSheetOpenChange: (batchId: string, open: boolean) => void;
  onOpenNoteDialog: (batch: SaleBatch) => void;
  onOpenEditDialog: (batch: SaleBatch) => void;
  formatDate: (date: Date | null) => string;
}) {
  return (
    <React.Fragment key={batch.id}>
      <TableRow
        className='cursor-pointer hover:bg-muted/50'
        onClick={() => onToggleBatch(batch.id)}
        onMouseEnter={() => prefetchMeterSaleDetails(batch.id)}
        onFocus={() => prefetchMeterSaleDetails(batch.id)}
        onTouchStart={() => prefetchMeterSaleDetails(batch.id)}>
        <TableCell className='w-10'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={(e) => {
              e.stopPropagation();
              onOpenEditDialog(batch);
            }}
            title={
              hasPendingRequest ? "View pending request" : "Edit sale record"
            }>
            {hasPendingRequest ? (
              <Clock className='h-4 w-4 text-amber-500' />
            ) : (
              <Pencil className='h-4 w-4' />
            )}
          </Button>
        </TableCell>
        <TableCell>{batch.user_name}</TableCell>
        <TableCell>{batch.meter_type}</TableCell>
        <TableCell className='text-center'>{batch.batch_amount}</TableCell>
        <TableCell>
          KES {Math.round(batch.total_price).toLocaleString()}
        </TableCell>
        <TableCell>{formatDate(batch.sale_date)}</TableCell>
        <TableCell className='max-w-[200px] truncate'>
          {batch.recipient}
        </TableCell>
        <TableCell>
          <Badge variant='outline' className='bg-blue-100'>
            {batch.customer_type
              ?.split(" ")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(" ")}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant='outline' className='bg-green-100'>
            {batch.customer_county}
          </Badge>
        </TableCell>
      </TableRow>
      <MeterSalesRow
        batch={batch}
        isOpen={isOpen}
        onOpenChange={(open) => onSheetOpenChange(batch.id, open)}
        onOpenNoteDialog={onOpenNoteDialog}
      />
    </React.Fragment>
  );
}

export function MeterSalesTable({
  batches,
  selectedBatchId,
  pendingRequestBatchIds = [],
  onToggleBatch,
  onSheetOpenChange,
  onOpenNoteDialog,
  onOpenEditDialog,
  formatDate,
}: MeterSalesTableProps) {
  if (!batches.length) {
    return null;
  }

  return (
    <div className='overflow-x-auto'>
      <div className='md:hidden space-y-4 p-4'>
        {batches.map((batch) => (
          <MobileBatchCard
            key={batch.id}
            batch={batch}
            isOpen={selectedBatchId === batch.id}
            hasPendingRequest={pendingRequestBatchIds.includes(batch.id)}
            onToggleBatch={onToggleBatch}
            onSheetOpenChange={onSheetOpenChange}
            onOpenNoteDialog={onOpenNoteDialog}
            onOpenEditDialog={onOpenEditDialog}
            formatDate={formatDate}
          />
        ))}
      </div>

      <div className='hidden md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-10'></TableHead>
              <TableHead className='w-[16%]'>Seller</TableHead>
              <TableHead className='w-[6%]'>Type</TableHead>
              <TableHead className='w-[7%] text-center'>Quantity</TableHead>
              <TableHead className='w-[14%]'>Sale Amount</TableHead>
              <TableHead className='w-[11%]'>Sale Date</TableHead>
              <TableHead className='w-[15%]'>Recipient</TableHead>
              <TableHead className='w-[14%]'>Customer Type</TableHead>
              <TableHead className='w-[10%]'>County</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <DesktopBatchRow
                key={batch.id}
                batch={batch}
                isOpen={selectedBatchId === batch.id}
                hasPendingRequest={pendingRequestBatchIds.includes(batch.id)}
                onToggleBatch={onToggleBatch}
                onSheetOpenChange={onSheetOpenChange}
                onOpenNoteDialog={onOpenNoteDialog}
                onOpenEditDialog={onOpenEditDialog}
                formatDate={formatDate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
