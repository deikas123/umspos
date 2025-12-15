"use client";

import { memo } from "react";
import { Trophy, TrendingUp, Package } from "lucide-react";
import type { TopPerformerData } from "./types";

interface StatsBarProps {
  topPerformer: TopPerformerData | null;
  totalSales: number;
  comparingCount: number;
}

export const StatsBar = memo(function StatsBar({
  topPerformer,
  totalSales,
  comparingCount,
}: Readonly<StatsBarProps>) {
  return (
    <div className='flex flex-wrap items-center gap-x-6 gap-y-2 py-3 px-4 bg-gradient-to-r from-amber-50/50 to-gray-50 rounded-lg border'>
      {topPerformer && (
        <div className='flex items-center gap-2'>
          <Trophy className='h-4 w-4 text-amber-600' />
          <span className='text-sm text-muted-foreground'>Top Agent:</span>
          <span className='font-semibold text-amber-900'>
            {topPerformer.name}
          </span>
          <span className='text-sm text-muted-foreground'>•</span>
          <span className='font-bold text-amber-900'>
            {topPerformer.totalMeters.toLocaleString()}
          </span>
          <span className='text-xs text-muted-foreground'>
            ({topPerformer.totalTransactions} sales)
          </span>
        </div>
      )}

      <div className='h-5 w-px bg-gray-300 hidden sm:block' />

      <div className='flex items-center gap-1.5'>
        <Package className='h-4 w-4 text-green-600' />
        <span className='text-sm text-muted-foreground'>Total Sales:</span>
        <span className='font-semibold'>{totalSales.toLocaleString()}</span>
      </div>

      <div className='h-5 w-px bg-gray-300 hidden sm:block' />

      <div className='flex items-center gap-1.5'>
        <TrendingUp className='h-4 w-4 text-purple-600' />
        <span className='text-sm text-muted-foreground'>Comparing:</span>
        <span className='font-semibold'>
          {comparingCount} agent{comparingCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
});
