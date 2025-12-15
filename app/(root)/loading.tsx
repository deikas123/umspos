import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col gap-6'>
        {/* Page header skeleton */}
        <div className='flex items-center justify-center'>
          <Skeleton className='h-9 w-64' />
        </div>

        {/* Content skeleton */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <Skeleton className='h-32 w-full rounded-lg' />
          <Skeleton className='h-32 w-full rounded-lg' />
          <Skeleton className='h-32 w-full rounded-lg' />
        </div>

        {/* Table skeleton */}
        <div className='space-y-3'>
          <Skeleton className='h-10 w-full rounded-lg' />
          <Skeleton className='h-16 w-full rounded-lg' />
          <Skeleton className='h-16 w-full rounded-lg' />
          <Skeleton className='h-16 w-full rounded-lg' />
          <Skeleton className='h-16 w-full rounded-lg' />
        </div>
      </div>
    </div>
  );
}
