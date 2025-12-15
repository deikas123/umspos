"use client";

import { Clock, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NoRequestsProps {
  type: "no-requests";
}

interface NoMatchesProps {
  type: "no-matches";
  onClearFilters: () => void;
}

type ApprovalsEmptyStateProps = NoRequestsProps | NoMatchesProps;

export function ApprovalsEmptyState(props: Readonly<ApprovalsEmptyStateProps>) {
  if (props.type === "no-requests") {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-16 gap-4'>
          <Clock className='h-16 w-16 text-muted-foreground' />
          <h3 className='text-lg font-medium'>No Pending Requests</h3>
          <p className='text-muted-foreground'>
            There are no update requests waiting for approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className='flex flex-col items-center justify-center py-16 gap-4'>
        <Filter className='h-16 w-16 text-muted-foreground' />
        <h3 className='text-lg font-medium'>No Matching Requests</h3>
        <p className='text-muted-foreground'>
          No requests match the current filters.
        </p>
        <Button variant='outline' onClick={props.onClearFilters}>
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}
