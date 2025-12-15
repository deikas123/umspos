import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col gap-6'>
        {/* Page title */}
        <div className='text-center'>
          <Skeleton className='h-9 w-48 mx-auto' />
        </div>

        {/* Summary cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={`summary-${i}`} className='rounded-lg border bg-card p-6'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-10 w-10 rounded-lg' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-6 w-16' />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className='grid gap-4 md:grid-cols-2'>
          <div className='rounded-lg border bg-card p-6'>
            <Skeleton className='h-6 w-40 mb-4' />
            <Skeleton className='h-[250px] w-full' />
          </div>
          <div className='rounded-lg border bg-card p-6'>
            <Skeleton className='h-6 w-40 mb-4' />
            <Skeleton className='h-[250px] w-full' />
          </div>
        </div>

        {/* Tables */}
        <div className='grid gap-4 lg:grid-cols-2'>
          <div className='rounded-lg border bg-card p-6'>
            <Skeleton className='h-6 w-32 mb-4' />
            <div className='space-y-3'>
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={`table1-row-${i}`}
                  className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-16' />
                </div>
              ))}
            </div>
          </div>
          <div className='rounded-lg border bg-card p-6'>
            <Skeleton className='h-6 w-32 mb-4' />
            <div className='space-y-3'>
              {Array.from({ length: 5 }, (_, j) => (
                <div
                  key={`table2-row-${j}`}
                  className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-16' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
