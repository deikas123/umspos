import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col gap-6'>
        {/* Page title */}
        <div className='text-center'>
          <Skeleton className='h-9 w-40 mx-auto' />
        </div>

        {/* Search and actions bar */}
        <div className='flex flex-wrap items-center gap-4'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-10 w-40' />
          <div className='ml-auto flex gap-2'>
            <Skeleton className='h-10 w-28' />
          </div>
        </div>

        {/* Users table */}
        <div className='rounded-lg border bg-card overflow-hidden'>
          {/* Table header */}
          <div className='flex items-center gap-4 p-4 border-b bg-muted/50'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-40 hidden md:block' />
            <Skeleton className='h-4 w-24 hidden lg:block' />
            <Skeleton className='h-4 w-20 hidden lg:block' />
            <Skeleton className='h-4 w-16 ml-auto' />
          </div>

          {/* Table rows */}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={`user-${i}`}
              className='flex items-center gap-4 p-4 border-b last:border-b-0'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <Skeleton className='h-4 w-28' />
              </div>
              <Skeleton className='h-4 w-40 hidden md:block' />
              <Skeleton className='h-6 w-20 rounded-full hidden lg:block' />
              <Skeleton className='h-4 w-20 hidden lg:block' />
              <Skeleton className='h-8 w-8 ml-auto rounded' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
