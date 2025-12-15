"use client";

import { useState, useMemo, memo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AgentFilterSelectProps } from "./types";

export const AgentFilterSelect = memo(function AgentFilterSelect({
  agents,
  selectedAgentId,
  onAgentChange,
}: Readonly<AgentFilterSelectProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) return agents;
    const searchLower = searchTerm.toLowerCase();
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(searchLower)
    );
  }, [agents, searchTerm]);

  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    return agents.find((agent) => agent.id.toString() === selectedAgentId);
  }, [agents, selectedAgentId]);

  const handleSelect = (agentId: string | undefined) => {
    onAgentChange(agentId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={isOpen}
          className='w-[180px] justify-between cursor-pointer'>
          <span className='truncate'>
            {selectedAgent ? selectedAgent.name : "All Agents"}
          </span>
          <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[220px] p-2' align='start'>
        <div className='space-y-2'>
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
            {/* All Agents option */}
            <button
              type='button'
              onClick={() => handleSelect(undefined)}
              className={cn(
                "flex items-center gap-2 w-full p-2 rounded text-sm cursor-pointer transition-colors hover:bg-gray-100",
                !selectedAgentId && "bg-gray-100"
              )}>
              <Check
                className={cn(
                  "h-4 w-4",
                  !selectedAgentId ? "opacity-100" : "opacity-0"
                )}
              />
              <span>All Agents</span>
            </button>

            {filteredAgents.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-2'>
                No agents found
              </p>
            ) : (
              filteredAgents.map((agent) => {
                const isSelected = selectedAgentId === agent.id.toString();
                return (
                  <button
                    type='button'
                    key={agent.id}
                    onClick={() => handleSelect(agent.id.toString())}
                    className={cn(
                      "flex items-center gap-2 w-full p-2 rounded text-sm cursor-pointer transition-colors hover:bg-gray-100",
                      isSelected && "bg-gray-100"
                    )}>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className='truncate'>{agent.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
