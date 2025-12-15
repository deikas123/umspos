"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Trophy, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MAX_COMPARISON_AGENTS } from "./constants";
import type { AgentBasicInfo } from "./types";

interface AgentSelectorProps {
  allAgents: AgentBasicInfo[];
  topPerformerAgentId: string | undefined;
  comparisonAgentIds: string[];
  onToggleAgent: (agentId: string) => void;
  onClear: () => void;
}

export const AgentSelector = memo(function AgentSelector({
  allAgents,
  topPerformerAgentId,
  comparisonAgentIds,
  onToggleAgent,
  onClear,
}: Readonly<AgentSelectorProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) return allAgents;
    const searchLower = searchTerm.toLowerCase();
    return allAgents.filter((agent) =>
      agent.name.toLowerCase().includes(searchLower)
    );
  }, [allAgents, searchTerm]);

  const isAgentInComparison = useCallback(
    (agentId: string) => {
      if (topPerformerAgentId === agentId) return true;
      return comparisonAgentIds.includes(agentId);
    },
    [topPerformerAgentId, comparisonAgentIds]
  );

  const comparisonCount = comparisonAgentIds.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' className='gap-2 cursor-pointer'>
          Compare Agents
          {comparisonCount > 0 && (
            <Badge variant='secondary' className='ml-1 h-5 px-1.5'>
              +{comparisonCount}
            </Badge>
          )}
          <ChevronDown className='h-4 w-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-72 p-3' align='end'>
        <div className='space-y-3'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='text-sm font-medium'>Compare with</p>
              <p className='text-xs text-muted-foreground'>
                Max {MAX_COMPARISON_AGENTS} agents total
              </p>
            </div>
            {comparisonCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='h-6 text-xs cursor-pointer'
                onClick={onClear}>
                Clear
              </Button>
            )}
          </div>
          <div className='relative'>
            <Search className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search agents...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-8 h-8 text-sm'
            />
          </div>
          <div className='max-h-[200px] overflow-y-auto space-y-1'>
            {filteredAgents.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-2'>
                No agents found
              </p>
            ) : (
              filteredAgents.map((agent) => {
                const isTopPerformer = topPerformerAgentId === agent.id;
                const isSelected = isAgentInComparison(agent.id);
                const isDisabled =
                  !isSelected &&
                  comparisonAgentIds.length >= MAX_COMPARISON_AGENTS - 1 &&
                  !isTopPerformer;

                let rowStyle = "hover:bg-gray-50";
                if (isTopPerformer) {
                  rowStyle = "bg-amber-50 border border-amber-200";
                } else if (isDisabled) {
                  rowStyle = "opacity-50 cursor-not-allowed";
                }

                return (
                  <label
                    key={agent.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${rowStyle}`}>
                    <Checkbox
                      checked={isSelected}
                      disabled={isTopPerformer || isDisabled}
                      onCheckedChange={() => onToggleAgent(agent.id)}
                    />
                    <span className='text-sm flex-1 truncate'>
                      {agent.name}
                    </span>
                    {isTopPerformer && (
                      <span className='flex items-center gap-1 text-xs text-amber-600'>
                        <Trophy className='h-3 w-3' />
                        Top
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
