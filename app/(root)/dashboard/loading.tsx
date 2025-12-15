import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col gap-6'>
        {/* Dashboard header */}
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-10 w-32' />
        </div>

        {/* Stats cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={`stat-${i}`} className='rounded-lg border bg-card p-6'>
              <div className='flex flex-col gap-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-8 w-16' />
                <Skeleton className='h-3 w-32' />
              </div>
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className='rounded-lg border bg-card p-6'>
          <Skeleton className='h-6 w-40 mb-4' />
          <Skeleton className='h-[300px] w-full' />
        </div>

        {/* Recent activity skeleton */}
        <div className='rounded-lg border bg-card p-6'>
          <Skeleton className='h-6 w-32 mb-4' />
          <div className='space-y-3'>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={`activity-${i}`} className='flex items-center gap-4'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
