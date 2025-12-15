"use client";

import { memo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Trophy, Package, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChartTooltip } from "./ChartTooltip";
import { formatAxisDate } from "./utils";
import { AGENT_COLORS } from "./constants";
import type { AgentData, SalesDataPoint } from "./types";

interface SalesChartProps {
  salesData: SalesDataPoint[];
  chartAgents: AgentData[];
  topPerformerName: string | undefined;
  chartYear: string;
  isFetching: boolean;
}

export const SalesChart = memo(function SalesChart({
  salesData,
  chartAgents,
  topPerformerName,
  chartYear,
  isFetching,
}: Readonly<SalesChartProps>) {
  const getAgentColor = useCallback(
    (agentName: string) => {
      if (topPerformerName === agentName) {
        return AGENT_COLORS[0];
      }
      const chartIndex = chartAgents.findIndex((a) => a.name === agentName);
      return AGENT_COLORS[chartIndex % AGENT_COLORS.length];
    },
    [chartAgents, topPerformerName]
  );

  return (
    <div className='relative'>
      {/* Selected Agents Badges with Year on far right */}
      {chartAgents.length > 0 && (
        <div className='flex flex-wrap items-center gap-2 mb-4'>
          {chartAgents.map((agent) => (
            <Badge
              key={agent.id}
              variant='secondary'
              className='gap-1'
              style={{
                borderLeft: `3px solid ${getAgentColor(agent.name)}`,
              }}>
              {agent.name}
              {topPerformerName === agent.name && (
                <Trophy className='h-3 w-3 text-amber-500 ml-1' />
              )}
            </Badge>
          ))}
          {chartYear && (
            <span className='ml-auto text-sm font-medium text-muted-foreground'>
              {chartYear}
            </span>
          )}
        </div>
      )}

      {isFetching && (
        <div className='absolute inset-0 bg-white/50 flex items-center justify-center z-10'>
          <Loader2 className='h-6 w-6 animate-spin' />
        </div>
      )}

      {salesData && salesData.length > 0 ? (
        <div className='h-[400px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={salesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB' />
              <XAxis
                dataKey='date'
                tickFormatter={formatAxisDate}
                tick={{ fontSize: 11 }}
                stroke='#9CA3AF'
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke='#9CA3AF'
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              {chartAgents.map((agent) => (
                <Line
                  key={agent.id}
                  type='monotone'
                  dataKey={agent.name}
                  name={agent.name}
                  stroke={getAgentColor(agent.name)}
                  strokeWidth={topPerformerName === agent.name ? 3 : 2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className='h-[400px] flex items-center justify-center text-muted-foreground'>
          <div className='text-center'>
            <Package className='h-12 w-12 mx-auto mb-3 opacity-50' />
            <p>No sales data available for the selected period</p>
          </div>
        </div>
      )}
    </div>
  );
});
