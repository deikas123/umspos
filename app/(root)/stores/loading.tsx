import { Skeleton } from "@/components/ui/skeleton";

export default function StoresLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col gap-6'>
        {/* Page title */}
        <div className='text-center'>
          <Skeleton className='h-9 w-56 mx-auto' />
        </div>

        {/* Search and actions bar */}
        <div className='flex flex-wrap items-center gap-4'>
          <Skeleton className='h-10 w-64' />
          <div className='ml-auto flex gap-2'>
            <Skeleton className='h-10 w-32' />
          </div>
        </div>

        {/* Store cards grid */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`store-${i}`} className='rounded-lg border bg-card p-6'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-12 w-12 rounded-full' />
                  <div className='space-y-2'>
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='h-4 w-24' />
                  </div>
                </div>
                <Skeleton className='h-6 w-16 rounded-full' />
              </div>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-16' />
                </div>
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-12' />
                </div>
              </div>
              <div className='mt-4 pt-4 border-t flex gap-2'>
                <Skeleton className='h-9 flex-1' />
                <Skeleton className='h-9 flex-1' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
