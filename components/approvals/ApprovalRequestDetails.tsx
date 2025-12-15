"use client";

import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PendingRequest } from "./types";
import { formatCurrency, formatDateValue } from "./utils";

interface ApprovalRequestDetailsProps {
  request: PendingRequest;
}

export function ApprovalRequestDetails({
  request,
}: Readonly<ApprovalRequestDetailsProps>) {
  return (
    <div className='bg-muted/30 p-6'>
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <h4 className='font-semibold mb-2 flex items-center gap-2'>
              <AlertCircle className='h-4 w-4 text-yellow-500' />
              Reason for Update
            </h4>
            <p className='text-sm bg-white p-3 rounded border'>
              {request.update_reason}
            </p>
          </div>
          <div>
            <h4 className='font-semibold mb-2'>Sale Details</h4>
            <div className='text-sm space-y-1'>
              <p>
                <span className='text-muted-foreground'>Quantity:</span>{" "}
                {request.batch_amount} units
              </p>
              <p>
                <span className='text-muted-foreground'>Destination:</span>{" "}
                {request.batch_destination}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className='font-semibold mb-3'>Proposed Changes</h4>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {request.new_sale_date && (
              <div className='bg-white p-4 rounded border'>
                <p className='text-xs text-muted-foreground mb-1'>Sale Date</p>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='bg-red-50 text-red-700'>
                    {formatDateValue(request.current_sale_date)}
                  </Badge>
                  <span>→</span>
                  <Badge
                    variant='outline'
                    className='bg-green-50 text-green-700'>
                    {formatDateValue(request.new_sale_date)}
                  </Badge>
                </div>
              </div>
            )}
            {request.new_unit_price && (
              <div className='bg-white p-4 rounded border'>
                <p className='text-xs text-muted-foreground mb-1'>Unit Price</p>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='bg-red-50 text-red-700'>
                    {formatCurrency(request.current_unit_price)}
                  </Badge>
                  <span>→</span>
                  <Badge
                    variant='outline'
                    className='bg-green-50 text-green-700'>
                    {formatCurrency(request.new_unit_price)}
                  </Badge>
                </div>
              </div>
            )}
            {request.new_total_price && (
              <div className='bg-white p-4 rounded border'>
                <p className='text-xs text-muted-foreground mb-1'>
                  Total Price
                </p>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='bg-red-50 text-red-700'>
                    {formatCurrency(request.current_total_price)}
                  </Badge>
                  <span>→</span>
                  <Badge
                    variant='outline'
                    className='bg-green-50 text-green-700'>
                    {formatCurrency(request.new_total_price)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
