import { Skeleton } from "@/components/ui/skeleton";

export default function ProspectsLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col gap-6'>
        {/* Page title */}
        <div className='text-center'>
          <Skeleton className='h-9 w-40 mx-auto' />
        </div>

        {/* Search and filter bar */}
        <div className='flex flex-wrap items-center gap-4'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-10 w-32' />
          <div className='ml-auto'>
            <Skeleton className='h-10 w-32' />
          </div>
        </div>

        {/* Prospects table/cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={`prospect-${i}`}
              className='rounded-lg border bg-card p-5'>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-5 w-32' />
                  <Skeleton className='h-6 w-16 rounded-full' />
                </div>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
                <div className='flex items-center gap-2 pt-2'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <div className='flex gap-2 pt-2'>
                  <Skeleton className='h-8 w-full' />
                  <Skeleton className='h-8 w-8' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
