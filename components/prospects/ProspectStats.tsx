"use client";

import { Users, CheckCircle2, TrendingUp, XCircle, Target } from "lucide-react";
import type { ClientProspect } from "@/lib/db/schema";

interface ProspectStatsProps {
  readonly prospects: readonly ClientProspect[];
}

export function ProspectStats({ prospects }: ProspectStatsProps) {
  const totalProspects = prospects.length;
  // Active: early-stage prospects (interested, prospect)
  const activeCount = prospects.filter((p) =>
    ["interested", "prospect"].includes(p.status)
  ).length;
  // Pipeline: in progress (lead, presentation, quotation_sent)
  const pipelineCount = prospects.filter((p) =>
    ["lead", "presentation", "quotation_sent"].includes(p.status)
  ).length;
  // Closed: won deals
  const closedCount = prospects.filter((p) => p.status === "closed").length;
  // Lost: dead deals (lost, not_interested)
  const lostCount = prospects.filter(
    (p) => p.status === "lost" || p.status === "not_interested"
  ).length;

  return (
    <div className='flex flex-wrap items-center gap-4 md:gap-6 py-3'>
      <div className='flex items-center gap-2'>
        <div className='p-1.5 rounded-md bg-gray-100'>
          <Users className='h-4 w-4 text-gray-600' />
        </div>
        <div className='flex items-baseline gap-1.5'>
          <span className='text-xl font-bold text-gray-900'>
            {totalProspects}
          </span>
          <span className='text-sm text-gray-500'>Total</span>
        </div>
      </div>

      <div className='h-6 w-px bg-gray-200 hidden sm:block' />

      <div className='flex items-center gap-2'>
        <div className='p-1.5 rounded-md bg-purple-50'>
          <Target className='h-4 w-4 text-purple-600' />
        </div>
        <div className='flex items-baseline gap-1.5'>
          <span className='text-xl font-bold text-purple-600'>
            {activeCount}
          </span>
          <span className='text-sm text-gray-500'>Active</span>
        </div>
      </div>

      <div className='h-6 w-px bg-gray-200 hidden sm:block' />

      <div className='flex items-center gap-2'>
        <div className='p-1.5 rounded-md bg-blue-50'>
          <TrendingUp className='h-4 w-4 text-blue-600' />
        </div>
        <div className='flex items-baseline gap-1.5'>
          <span className='text-xl font-bold text-blue-600'>
            {pipelineCount}
          </span>
          <span className='text-sm text-gray-500'>Pipeline</span>
        </div>
      </div>

      <div className='h-6 w-px bg-gray-200 hidden sm:block' />

      <div className='flex items-center gap-2'>
        <div className='p-1.5 rounded-md bg-green-50'>
          <CheckCircle2 className='h-4 w-4 text-green-600' />
        </div>
        <div className='flex items-baseline gap-1.5'>
          <span className='text-xl font-bold text-green-600'>
            {closedCount}
          </span>
          <span className='text-sm text-gray-500'>Closed</span>
        </div>
      </div>

      <div className='h-6 w-px bg-gray-200 hidden sm:block' />

      <div className='flex items-center gap-2'>
        <div className='p-1.5 rounded-md bg-red-50'>
          <XCircle className='h-4 w-4 text-red-600' />
        </div>
        <div className='flex items-baseline gap-1.5'>
          <span className='text-xl font-bold text-red-600'>{lostCount}</span>
          <span className='text-sm text-gray-500'>Lost</span>
        </div>
      </div>
    </div>
  );
}
