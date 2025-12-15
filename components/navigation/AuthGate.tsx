"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGateProps {
  readonly children: React.ReactNode;
}

/**
 * AuthGate blocks page content from rendering until auth state is known.
 * This prevents users from seeing pages they may not have permission to view.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { isLoading, userRole } = useAuth();

  // Show loading skeleton until auth is fully loaded
  if (isLoading || !userRole) {
    return (
      <div className='p-4 md:p-6 space-y-6'>
        {/* Header skeleton */}
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-10 w-32' />
        </div>

        {/* Content skeleton */}
        <div className='space-y-4'>
          <div className='flex gap-4'>
            <Skeleton className='h-24 w-full max-w-xs' />
            <Skeleton className='h-24 w-full max-w-xs' />
            <Skeleton className='h-24 w-full max-w-xs' />
          </div>

          {/* Table skeleton */}
          <div className='border rounded-lg p-4 space-y-3'>
            <div className='flex gap-4'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-28' />
            </div>
            {Array.from({ length: 5 }, (_, index) => `skeleton-${Date.now()}-${index}`).map((uniqueKey) => (
              <div key={uniqueKey} className='flex gap-4'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-28' />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div>{children}</div>;
}
