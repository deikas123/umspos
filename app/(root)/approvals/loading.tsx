import { Skeleton } from "@/components/ui/skeleton";

export default function ApprovalsLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col gap-6'>
        {/* Page title */}
        <div className='text-center'>
          <Skeleton className='h-9 w-48 mx-auto' />
        </div>

        {/* Filter tabs */}
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-24' />
        </div>

        {/* Approval cards */}
        <div className='space-y-4'>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={`approval-${i}`}
              className='rounded-lg border bg-card p-6'>
              <div className='flex items-start justify-between'>
                <div className='flex-1 space-y-3'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='space-y-1'>
                      <Skeleton className='h-5 w-32' />
                      <Skeleton className='h-4 w-24' />
                    </div>
                  </div>
                  <Skeleton className='h-4 w-3/4' />
                  <div className='flex gap-4'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Skeleton className='h-9 w-24' />
                  <Skeleton className='h-9 w-24' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
