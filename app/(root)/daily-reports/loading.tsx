import { Skeleton } from "@/components/ui/skeleton";

export default function DailyReportsLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col gap-6'>
        {/* Page title */}
        <div className='text-center'>
          <Skeleton className='h-9 w-48 mx-auto' />
        </div>

        {/* Date filters and actions */}
        <div className='flex flex-wrap items-center gap-4'>
          <Skeleton className='h-10 w-40' />
          <Skeleton className='h-10 w-40' />
          <Skeleton className='h-10 w-32' />
          <div className='ml-auto flex gap-2'>
            <Skeleton className='h-10 w-28' />
            <Skeleton className='h-10 w-10' />
          </div>
        </div>

        {/* Summary cards */}
        <div className='grid gap-4 md:grid-cols-3'>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={`summary-${i}`} className='rounded-lg border bg-card p-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-7 w-16' />
                </div>
                <Skeleton className='h-10 w-10 rounded-lg' />
              </div>
            </div>
          ))}
        </div>

        {/* Sales table */}
        <div className='rounded-lg border bg-card overflow-hidden'>
          <div className='flex items-center gap-4 p-4 border-b bg-muted/50'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-16 ml-auto' />
          </div>

          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={`row-${i}`}
              className='flex items-center gap-4 p-4 border-b last:border-b-0'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-8 w-8 ml-auto rounded' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
