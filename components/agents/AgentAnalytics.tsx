"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAgentSalesAnalytics } from "@/lib/actions/agents";

import {
  StatsBar,
  Rankings,
  SalesChart,
  AgentSelector,
  TIME_PERIODS,
  MAX_COMPARISON_AGENTS,
  getYearFromData,
  type TimePeriod,
  type AgentData,
  type AgentBasicInfo,
} from "./analytics";

interface AgentAnalyticsProps {
  agents: AgentBasicInfo[];
}

export default function AgentAnalytics({
  agents: allAgents,
}: Readonly<AgentAnalyticsProps>) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [comparisonAgentIds, setComparisonAgentIds] = useState<string[]>([]);

  const days = TIME_PERIODS[timePeriod].days;

  // Fetch analytics data
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["agentSalesAnalytics", days],
    queryFn: () => getAgentSalesAnalytics(undefined, days),
    staleTime: 1000 * 60 * 2,
  });

  // Top performer data
  const topPerformer = data?.topPerformer ?? null;

  // Find the top performer agent object
  const topPerformerAgent = useMemo(() => {
    if (!topPerformer || !data?.agents) return null;
    return data.agents.find((a) => a.name === topPerformer.name) ?? null;
  }, [data, topPerformer]);

  // Agents to show on chart
  const chartAgents = useMemo(() => {
    if (!data?.agents) return [];

    const agentsMap = new Map<string, AgentData>();

    if (topPerformerAgent) {
      agentsMap.set(topPerformerAgent.id, topPerformerAgent);
    }

    for (const agentId of comparisonAgentIds) {
      if (agentsMap.size >= MAX_COMPARISON_AGENTS) break;
      const agent = data.agents.find((a) => a.id === agentId);
      if (agent && !agentsMap.has(agent.id)) {
        agentsMap.set(agent.id, agent);
      }
    }

    return Array.from(agentsMap.values());
  }, [data, topPerformerAgent, comparisonAgentIds]);

  // Chart year
  const chartYear = useMemo(() => {
    if (!data?.salesData) return "";
    return getYearFromData(data.salesData);
  }, [data?.salesData]);

  // Sorted agents for rankings - memoized
  const sortedAgents = useMemo(() => {
    if (!data?.agents) return [];
    return [...data.agents].sort((a, b) => b.totalSales - a.totalSales);
  }, [data?.agents]);

  // Total sales - memoized
  const totalSales = useMemo(() => {
    return data?.agents.reduce((sum, a) => sum + a.totalSales, 0) ?? 0;
  }, [data?.agents]);

  // Toggle comparison agent
  const toggleComparisonAgent = useCallback(
    (agentId: string) => {
      if (topPerformerAgent?.id === agentId) return;

      setComparisonAgentIds((prev) => {
        if (prev.includes(agentId)) {
          return prev.filter((id) => id !== agentId);
        }
        const maxAdditional = MAX_COMPARISON_AGENTS - 1;
        if (prev.length >= maxAdditional) {
          return prev;
        }
        return [...prev, agentId];
      });
    },
    [topPerformerAgent?.id]
  );

  // Clear comparison
  const clearComparison = useCallback(() => {
    setComparisonAgentIds([]);
  }, []);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Bar */}
      <StatsBar
        topPerformer={topPerformer}
        totalSales={totalSales}
        comparingCount={chartAgents.length}
      />

      {/* Chart Card */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Agent Sales Over Time
              </CardTitle>
              <CardDescription>Daily meter sales by agent</CardDescription>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              {/* Time Period Selector */}
              <Select
                value={timePeriod}
                onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className='w-[130px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIME_PERIODS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Agent Comparison Selector */}
              <AgentSelector
                allAgents={allAgents}
                topPerformerAgentId={topPerformerAgent?.id}
                comparisonAgentIds={comparisonAgentIds}
                onToggleAgent={toggleComparisonAgent}
                onClear={clearComparison}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Sales Chart */}
          <SalesChart
            salesData={data?.salesData ?? []}
            chartAgents={chartAgents}
            topPerformerName={topPerformer?.name}
            chartYear={chartYear}
            isFetching={isFetching}
          />
        </CardContent>
      </Card>

      {/* Agent Rankings */}
      <Rankings sortedAgents={sortedAgents} />
    </div>
  );
}
