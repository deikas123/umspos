"use client";

import { memo } from "react";
import { formatDateTimeShort } from "@/lib/utils/dateUtils";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  getTransactionTypeBadge,
  getMeterTypeBadge,
} from "./HistoryTable";
import type {
  HistoryMobileListProps,
  Transaction,
  TransactionInfo,
} from "./types";

const MobileTransactionCard = memo(function MobileTransactionCard({
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
        agentName: transaction.agent_name ?? undefined,
        transactionDate: transaction.transaction_date,
        transactionType: transaction.transaction_type,
        meterType: transaction.meter_type,
        quantity: transaction.quantity,
      });
    }
  };

  return (
    <div className='border rounded-lg p-4 space-y-3'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='font-semibold text-sm'>
            {transaction.agent_name || "Unknown Agent"}
          </p>
          <p className='text-xs text-gray-500'>
            {transaction.transaction_date
              ? formatDateTimeShort(transaction.transaction_date)
              : "N/A"}
          </p>
        </div>
        <div className='text-right'>
          {onQuantityClick && transaction.agent_id ? (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleQuantityClick}
              className='font-bold text-lg text-primary hover:text-primary hover:underline h-auto p-0 cursor-pointer'>
              {transaction.quantity}
            </Button>
          ) : (
            <p className='text-lg font-bold'>{transaction.quantity}</p>
          )}
          <p className='text-xs text-gray-500'>Meters</p>
        </div>
      </div>

      <div className='flex items-center gap-2 flex-wrap'>
        {getTransactionTypeBadge(transaction.transaction_type)}
        {getMeterTypeBadge(transaction.meter_type)}
      </div>
    </div>
  );
});

export const HistoryMobileList = memo(function HistoryMobileList({
  transactions,
  onQuantityClick,
}: Readonly<HistoryMobileListProps>) {
  return (
    <div className='block md:hidden space-y-4'>
      {transactions.length > 0 ? (
        transactions.map((transaction) => (
          <MobileTransactionCard
            key={transaction.id}
            transaction={transaction}
            onQuantityClick={onQuantityClick}
          />
        ))
      ) : (
        <EmptyState />
      )}
    </div>
  );
});
