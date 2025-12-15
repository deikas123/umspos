"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  ChevronDown,
  Clock,
  User,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PendingRequest } from "./types";
import { formatCurrency, formatDateValue, formatDateTime } from "./utils";

interface ApprovalRequestCardProps {
  request: PendingRequest;
  isExpanded: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalRequestCard({
  request,
  isExpanded,
  isApproving,
  isRejecting,
  onToggleExpand,
  onApprove,
  onReject,
}: Readonly<ApprovalRequestCardProps>) {
  // Compare new values with current values - only show change if they're actually different
  const hasDateChange =
    request.new_sale_date !== null &&
    new Date(request.new_sale_date).getTime() !==
      new Date(request.current_sale_date ?? 0).getTime();

  const hasUnitPriceChange =
    request.new_unit_price !== null &&
    request.new_unit_price !== request.current_unit_price;

  const hasTotalPriceChange =
    request.new_total_price !== null &&
    request.new_total_price !== request.current_total_price;

  const changesCount = [
    hasDateChange,
    hasUnitPriceChange,
    hasTotalPriceChange,
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}>
      <Card className='overflow-hidden transition-all duration-200 hover:shadow-md border-l-4 border-l-yellow-400'>
        <CardContent className='p-0'>
          <button
            className='p-4 cursor-pointer w-full text-left'
            onClick={onToggleExpand}
            type='button'>
            {/* Header Row */}
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1 min-w-0'>
                {/* Requester & Time */}
                <div className='flex items-center gap-2 mb-2'>
                  <div className='flex items-center gap-1.5 text-sm font-medium'>
                    <User className='h-4 w-4 text-muted-foreground' />
                    <span>{request.requested_by_name}</span>
                  </div>
                  <span className='text-muted-foreground'>•</span>
                  <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                    <Clock className='h-3.5 w-3.5' />
                    <span>{formatDateTime(request.requested_at)}</span>
                  </div>
                </div>

                {/* Sale Info Grid */}
                <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
                  <div className='flex items-center gap-1.5'>
                    <Package className='h-3.5 w-3.5 text-blue-500' />
                    <span className='text-muted-foreground'>Type:</span>
                    <span className='font-medium'>
                      {request.batch_meter_type}
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-muted-foreground'>Qty:</span>
                    <Badge variant='secondary' className='text-xs h-5'>
                      {request.batch_amount} units
                    </Badge>
                  </div>
                  <div className='flex items-center gap-1.5 min-w-0'>
                    <MapPin className='h-3.5 w-3.5 text-green-500 flex-shrink-0' />
                    <span className='text-muted-foreground'>To:</span>
                    <span className='font-medium truncate max-w-[150px]'>
                      {request.batch_recipient}
                    </span>
                  </div>
                </div>
              </div>

              {/* Changes Badge & Expand */}
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='bg-yellow-50 text-yellow-700 border-yellow-200'>
                  {changesCount} change{changesCount !== 1 && "s"}
                </Badge>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </button>
        </CardContent>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className='overflow-hidden'>
              <Separator />
              <div className='p-4 bg-muted/30 space-y-4'>
                {/* Reason Section */}
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm font-medium'>
                    <AlertCircle className='h-4 w-4 text-yellow-500' />
                    <span>Reason for Update</span>
                  </div>
                  <div className='bg-white rounded-lg border p-3 text-sm'>
                    {request.update_reason}
                  </div>
                </div>

                {/* Changes Grid */}
                <div className='space-y-2'>
                  <h4 className='text-sm font-medium'>Proposed Changes</h4>
                  <div className='flex flex-wrap gap-3'>
                    {hasDateChange && (
                      <ChangeCard
                        icon={<Calendar className='h-4 w-4' />}
                        label='Sale Date'
                        oldValue={formatDateValue(request.current_sale_date)}
                        newValue={formatDateValue(request.new_sale_date)}
                      />
                    )}
                    {hasUnitPriceChange && (
                      <ChangeCard
                        icon={<DollarSign className='h-4 w-4' />}
                        label='Unit Price'
                        oldValue={formatCurrency(request.current_unit_price)}
                        newValue={formatCurrency(request.new_unit_price!)}
                      />
                    )}
                    {hasTotalPriceChange && (
                      <ChangeCard
                        icon={<DollarSign className='h-4 w-4' />}
                        label='Total Price'
                        oldValue={formatCurrency(request.current_total_price)}
                        newValue={formatCurrency(request.new_total_price!)}
                      />
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1.5'>
                    <User className='h-3.5 w-3.5' />
                    <span>Seller: {request.batch_user_name}</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <MapPin className='h-3.5 w-3.5' />
                    <span>Destination: {request.batch_destination}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className='flex justify-end gap-2 pt-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    className='text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject();
                    }}
                    disabled={isRejecting}>
                    <X className='h-4 w-4 mr-1.5' />
                    Reject
                  </Button>
                  <Button
                    size='sm'
                    className='bg-green-600 hover:bg-green-700 text-white'
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove();
                    }}
                    disabled={isApproving}>
                    <Check className='h-4 w-4 mr-1.5' />
                    Approve
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

interface ChangeCardProps {
  icon: React.ReactNode;
  label: string;
  oldValue: string;
  newValue: string;
}

function ChangeCard({
  icon,
  label,
  oldValue,
  newValue,
}: Readonly<ChangeCardProps>) {
  return (
    <div className='bg-white rounded-lg border p-3 space-y-2'>
      <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
        {icon}
        <span>{label}</span>
      </div>
      <div className='flex items-center gap-2 whitespace-nowrap'>
        <span className='text-sm line-through text-red-500/80'>{oldValue}</span>
        <ArrowRight className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
        <span className='text-sm font-medium text-green-600'>{newValue}</span>
      </div>
    </div>
  );
}
