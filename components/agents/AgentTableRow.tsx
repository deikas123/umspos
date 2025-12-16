"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, MapPin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AgentActionsMenu from "./AgentActionsMenu";
import { type Agent } from "./hooks/useAgentsData";

interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  is_active?: boolean | null;
}

interface AgentTableRowProps {
  readonly agent: Agent;
  readonly currentUser: CurrentUser | null | undefined;
  readonly meterCountsByType?: Record<string, number>;
  readonly onToggleStatus: (agent: Agent) => Promise<void>;
  readonly onEdit: (agent: Agent) => void;
  readonly onDelete: (agent: Agent) => Promise<void>;
  readonly onSaleClose: () => void;
}

export default function AgentTableRow({
  agent,
  currentUser,
  meterCountsByType,
  onToggleStatus,
  onEdit,
  onDelete,
  onSaleClose,
}: AgentTableRowProps) {
  const hasMeterBreakdown =
    meterCountsByType && Object.keys(meterCountsByType).length > 0;

  return (
    <TableRow className='hover:bg-gray-50'>
      <TableCell className='font-medium'>{agent.name}</TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <PhoneCall className='h-4 w-4 text-primary' />
          {agent.phone_number}
        </div>
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <MapPin className='h-4 w-4 text-[#E46020]' />
          {agent.location}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant='outline' className='bg-gray-100 text-gray-800'>
          {agent.county}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant='outline'
          className={
            agent.agent_type === "credit"
              ? "bg-purple-100 text-purple-800"
              : "bg-emerald-100 text-emerald-800"
          }>
          {agent.agent_type === "credit" ? "Credit" : "Cash"}
        </Badge>
      </TableCell>
      <TableCell className='text-center'>
        {hasMeterBreakdown ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant='outline'
                  className='bg-blue-100 text-blue-800 cursor-help'>
                  {agent.total_meters ?? 0}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className='p-2'>
                <div className='text-xs space-y-1'>
                  <p className='font-semibold mb-1'>Meter Breakdown:</p>
                  {!!meterCountsByType.integrated && (
                    <p>Integrated: {meterCountsByType.integrated}</p>
                  )}
                  {!!meterCountsByType.split && (
                    <p>Split: {meterCountsByType.split}</p>
                  )}
                  {!!meterCountsByType.gas && (
                    <p>Gas: {meterCountsByType.gas}</p>
                  )}
                  {!!meterCountsByType.water && (
                    <p>Water: {meterCountsByType.water}</p>
                  )}
                  {!!meterCountsByType.smart && (
                    <p>Smart: {meterCountsByType.smart}</p>
                  )}
                  {!!meterCountsByType["3 phase"] && (
                    <p>3 Phase: {meterCountsByType["3 phase"]}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge variant='outline' className='bg-blue-100 text-blue-800'>
            {agent.total_meters ?? 0}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant='outline'
          className={
            agent.is_active
              ? "bg-[#2ECC40] text-white"
              : "bg-gray-500 text-white"
          }>
          {agent.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>
        <AgentActionsMenu
          agent={agent}
          currentUser={currentUser}
          onEdit={onEdit}
          onSaleClose={onSaleClose}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
