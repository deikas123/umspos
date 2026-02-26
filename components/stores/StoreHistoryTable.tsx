"use client";

import { memo } from "react";
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
import { History } from "lucide-react";
import { formatDateTimeShort } from "@/lib/utils/dateUtils";

interface Transaction {
  id: string | number;
  agent_id?: string | null;
  transaction_date: string | Date | null;
  transaction_type: string;
  meter_type: string;
  quantity: number;
  performed_by_name?: string | null;
}

interface TransactionInfo {
  agentId: string;
  agentName?: string;
  transactionDate: Date | string;
  transactionType: string;
  meterType: string;
  quantity: number;
}

interface StoreHistoryTableProps {
  readonly transactions: Transaction[];
  readonly onQuantityClick?: (info: TransactionInfo) => void;
}

const EmptyState = () => (
  <div className='flex flex-col items-center justify-center p-8 text-gray-500'>
    <div className='relative'>
      <History className='w-12 h-12 mb-4 text-gray-400' />
      <span className='absolute -bottom-1 -right-1 flex h-3 w-3'>
        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
        <span className='relative inline-flex rounded-full h-3 w-3 bg-primary'></span>
      </span>
    </div>
    <p className='text-sm font-medium'>No transaction history yet</p>
    <p className='text-xs text-gray-400 mt-1'>
      Store transactions will appear here
    </p>
  </div>
);

const getTransactionTypeBadge = (type: string) => {
  const variants: Record<string, { variant: "outline"; className: string }> = {
    assignment: {
      variant: "outline",
      className: "bg-blue-100 text-blue-800 border-blue-300",
    },
    sale: {
      variant: "outline",
      className: "bg-green-100 text-green-800 border-green-300",
    },
    return: {
      variant: "outline",
      className: "bg-orange-100 text-orange-800 border-orange-300",
    },
  };

  const config = variants[type] || variants.assignment;

  return (
    <Badge variant={config.variant} className={config.className}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
};

const getMeterTypeBadge = (type: string) => {
  return (
    <Badge variant='secondary' className='bg-gray-100 text-gray-800'>
      {type}
    </Badge>
  );
};

const TransactionRow = memo(function TransactionRow({
  transaction,
  onQuantityClick,
}: {
  transaction: Transaction;
  onQuantityClick?: (info: TransactionInfo) => void;
}) {
  const handleQuantityClick = () => {
    if (
      onQuantityClick &&
      transaction.agent_id &&
      transaction.transaction_date
    ) {
      onQuantityClick({
        agentId: transaction.agent_id,
        transactionDate: transaction.transaction_date,
        transactionType: transaction.transaction_type,
        meterType: transaction.meter_type,
        quantity: transaction.quantity,
      });
    }
  };

  return (
    <TableRow>
      <TableCell>
        {transaction.transaction_date
          ? formatDateTimeShort(transaction.transaction_date)
          : "N/A"}
      </TableCell>
      <TableCell>
        {getTransactionTypeBadge(transaction.transaction_type)}
      </TableCell>
      <TableCell>{getMeterTypeBadge(transaction.meter_type)}</TableCell>
      <TableCell>{transaction.performed_by_name || "—"}</TableCell>
      <TableCell className='text-right'>
        {onQuantityClick && transaction.agent_id ? (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleQuantityClick}
            className='font-semibold text-primary hover:text-primary hover:underline h-auto py-1 px-2 cursor-pointer'>
            {transaction.quantity}
          </Button>
        ) : (
          <span className='font-semibold'>{transaction.quantity}</span>
        )}
      </TableCell>
    </TableRow>
  );
});

export default function StoreHistoryTable({
  transactions,
  onQuantityClick,
}: StoreHistoryTableProps) {
  return (
    <div className='hidden md:block'>
      <Table>
        <TableHeader>
          <TableRow className='bg-gray-50'>
            <TableHead className='font-semibold'>Date</TableHead>
            <TableHead className='font-semibold'>Transaction Type</TableHead>
            <TableHead className='font-semibold'>Meter Type</TableHead>
            <TableHead className='font-semibold'>Performed By</TableHead>
            <TableHead className='font-semibold text-right'>Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onQuantityClick={onQuantityClick}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5}>
                <EmptyState />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { EmptyState, getTransactionTypeBadge, getMeterTypeBadge };
