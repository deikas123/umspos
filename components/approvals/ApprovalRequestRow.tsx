"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { PendingRequest } from "./types";
import { formatDateTime } from "./utils";
import { ApprovalRequestDetails } from "./ApprovalRequestDetails";

interface ApprovalRequestRowProps {
  request: PendingRequest;
  isExpanded: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalRequestRow({
  request,
  isExpanded,
  isApproving,
  isRejecting,
  onToggleExpand,
  onApprove,
  onReject,
}: Readonly<ApprovalRequestRowProps>) {
  return (
    <React.Fragment>
      <TableRow
        className='cursor-pointer hover:bg-muted/50'
        onClick={onToggleExpand}>
        <TableCell>
          {isExpanded ? (
            <ChevronUp className='h-4 w-4' />
          ) : (
            <ChevronDown className='h-4 w-4' />
          )}
        </TableCell>
        <TableCell className='font-medium'>
          {request.requested_by_name}
        </TableCell>
        <TableCell>{request.batch_user_name}</TableCell>
        <TableCell>{request.batch_meter_type}</TableCell>
        <TableCell className='max-w-[150px] truncate'>
          {request.batch_recipient}
        </TableCell>
        <TableCell>{formatDateTime(request.requested_at)}</TableCell>
        <TableCell className='text-right'>
          <div className='flex justify-end gap-2'>
            <Button
              size='sm'
              variant='outline'
              className='text-green-600 hover:text-green-700 hover:bg-green-50'
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
              disabled={isApproving}>
              <Check className='h-4 w-4 mr-1' />
              Approve
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='text-red-600 hover:text-red-700 hover:bg-red-50'
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              disabled={isRejecting}>
              <X className='h-4 w-4 mr-1' />
              Reject
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}>
            <TableCell colSpan={7} className='p-0 overflow-hidden'>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, delay: 0.05 }}>
                <ApprovalRequestDetails request={request} />
              </motion.div>
            </TableCell>
          </motion.tr>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
}
