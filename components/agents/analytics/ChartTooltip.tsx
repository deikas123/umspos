"use client";

import type { TooltipPayloadEntry } from "./types";

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
}: Readonly<ChartTooltipProps>) {
  if (active && payload?.length) {
    const date = new Date(label ?? "");
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return (
      <div className='bg-white p-3 border rounded-lg shadow-lg'>
        <p className='font-semibold text-sm mb-2'>{formattedDate}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className='flex items-center gap-2 text-sm'>
            <div
              className='w-3 h-3 rounded-full'
              style={{ backgroundColor: entry.color }}
            />
            <span className='font-medium'>{entry.name}:</span>
            <span>{entry.value} meters</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
