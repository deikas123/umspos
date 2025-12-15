"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PendingRequest } from "./types";
import { ApprovalRequestCard } from "./ApprovalRequestCard";

interface ApprovalsListProps {
  requests: PendingRequest[];
  totalCount: number;
  hasActiveFilters: boolean;
  expandedRowId: string | null;
  isApproving: boolean;
  isRejecting: boolean;
  onToggleExpand: (requestId: string) => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export function ApprovalsList({
  requests,
  totalCount,
  hasActiveFilters,
  expandedRowId,
  isApproving,
  isRejecting,
  onToggleExpand,
  onApprove,
  onReject,
}: Readonly<ApprovalsListProps>) {
  return (
    <Card>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center gap-2'>
          <span>Pending Requests</span>
          <span className='text-lg font-normal text-muted-foreground'>
            ({requests.length}
            {hasActiveFilters && ` of ${totalCount}`})
          </span>
        </CardTitle>
        <CardDescription>
          Review and approve or reject pending update requests
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {requests.map((request) => (
          <ApprovalRequestCard
            key={request.id}
            request={request}
            isExpanded={expandedRowId === request.id}
            isApproving={isApproving}
            isRejecting={isRejecting}
            onToggleExpand={() => onToggleExpand(request.id)}
            onApprove={() => onApprove(request.id)}
            onReject={() => onReject(request.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
