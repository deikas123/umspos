"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PendingRequest } from "./types";
import { ApprovalRequestRow } from "./ApprovalRequestRow";

interface ApprovalsTableProps {
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

export function ApprovalsTable({
  requests,
  totalCount,
  hasActiveFilters,
  expandedRowId,
  isApproving,
  isRejecting,
  onToggleExpand,
  onApprove,
  onReject,
}: Readonly<ApprovalsTableProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Pending Requests ({requests.length}
          {hasActiveFilters && ` of ${totalCount}`})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'></TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Sale Seller</TableHead>
                <TableHead>Meter Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <ApprovalRequestRow
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
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
