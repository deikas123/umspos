import { Skeleton } from "@/components/ui/skeleton";

export default function SalesLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col items-center gap-6'>
        {/* Page title */}
        <Skeleton className='h-9 w-48' />

        {/* Filter bar */}
        <div className='w-full flex flex-wrap items-center gap-4'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-32' />
          <div className='ml-auto flex gap-2'>
            <Skeleton className='h-10 w-10' />
            <Skeleton className='h-10 w-24' />
          </div>
        </div>

        {/* Table header */}
        <div className='w-full rounded-lg border bg-card'>
          <div className='flex items-center gap-4 p-4 border-b bg-muted/50'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-32 hidden md:block' />
            <Skeleton className='h-4 w-24 hidden lg:block' />
            <Skeleton className='h-4 w-20 hidden lg:block' />
            <Skeleton className='h-4 w-16 ml-auto' />
          </div>

          {/* Table rows */}
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={`row-${i}`}
              className='flex items-center gap-4 p-4 border-b last:border-b-0'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-32 hidden md:block' />
              <Skeleton className='h-4 w-24 hidden lg:block' />
              <Skeleton className='h-4 w-20 hidden lg:block' />
              <Skeleton className='h-8 w-8 ml-auto rounded' />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className='w-full flex items-center justify-between'>
          <Skeleton className='h-4 w-32' />
          <div className='flex gap-2'>
            <Skeleton className='h-9 w-9' />
            <Skeleton className='h-9 w-9' />
            <Skeleton className='h-9 w-9' />
          </div>
        </div>
      </div>
    </div>
  );
}
