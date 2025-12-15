"use client";

import { memo } from "react";
import { formatDateTimeShort } from "@/lib/utils/dateUtils";
import {
  EmptyState,
  getTransactionTypeBadge,
  getMeterTypeBadge,
} from "./HistoryTable";
import type { HistoryMobileListProps, Transaction } from "./types";

const MobileTransactionCard = memo(function MobileTransactionCard({
  transaction,
}: {
  transaction: Transaction;
}) {
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
          <p className='text-lg font-bold'>{transaction.quantity}</p>
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
}: Readonly<HistoryMobileListProps>) {
  return (
    <div className='block md:hidden space-y-4'>
      {transactions.length > 0 ? (
        transactions.map((transaction) => (
          <MobileTransactionCard
            key={transaction.id}
            transaction={transaction}
          />
        ))
      ) : (
        <EmptyState />
      )}
    </div>
  );
});
