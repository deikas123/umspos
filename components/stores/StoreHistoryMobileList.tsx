"use client";

import { memo } from "react";
import { formatDateTimeShort } from "@/lib/utils/dateUtils";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  getTransactionTypeBadge,
  getMeterTypeBadge,
} from "./StoreHistoryTable";

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

interface StoreHistoryMobileListProps {
  readonly transactions: Transaction[];
  readonly onQuantityClick?: (info: TransactionInfo) => void;
}

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
      {transaction.performed_by_name && (
        <p className='text-xs text-gray-500'>
          By {transaction.performed_by_name}
        </p>
      )}
    </div>
  );
});

export default function StoreHistoryMobileList({
  transactions,
  onQuantityClick,
}: StoreHistoryMobileListProps) {
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
}
