"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getRankingRowStyle, getRankingBadgeStyle } from "./utils";
import { RANKINGS_PER_PAGE } from "./constants";
import type { AgentData } from "./types";

interface RankingsProps {
  sortedAgents: AgentData[];
}

export const Rankings = memo(function Rankings({
  sortedAgents,
}: Readonly<RankingsProps>) {
  const [rankingsPage, setRankingsPage] = useState(1);

  const paginatedRankings = useMemo(() => {
    return sortedAgents.slice(0, rankingsPage * RANKINGS_PER_PAGE);
  }, [sortedAgents, rankingsPage]);

  const hasMoreRankings = paginatedRankings.length < sortedAgents.length;

  const loadMoreRankings = useCallback(() => {
    setRankingsPage((prev) => prev + 1);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5 text-amber-500' />
          Agent Rankings
        </CardTitle>
        <CardDescription>
          All-time sales performance by agent
          {sortedAgents.length > 0 && (
            <span className='ml-2 text-xs'>
              (Showing {paginatedRankings.length} of {sortedAgents.length})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {paginatedRankings.map((agent, index) => (
            <div
              key={agent.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${getRankingRowStyle(index)}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankingBadgeStyle(index)}`}>
                {index + 1}
              </div>
              <div className='flex-1'>
                <p className='font-medium'>{agent.name}</p>
              </div>
              <div className='text-right'>
                <p className='font-bold text-lg'>
                  {agent.totalSales.toLocaleString()}
                </p>
                <p className='text-xs text-muted-foreground'>meters sold</p>
              </div>
            </div>
          ))}

          {paginatedRankings.length === 0 && (
            <div className='text-center py-8 text-muted-foreground'>
              No agent sales data available
            </div>
          )}

          {hasMoreRankings && (
            <div className='pt-4 text-center'>
              <Button
                variant='outline'
                onClick={loadMoreRankings}
                className='w-full sm:w-auto cursor-pointer'>
                Load More{" "}
                <span className='ml-1 text-xs text-muted-foreground'>
                  ({sortedAgents.length - paginatedRankings.length} remaining)
                </span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
