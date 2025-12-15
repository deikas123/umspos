import { Skeleton } from "@/components/ui/skeleton";

export default function OfflineLoading() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-6'>
        <Skeleton className='h-16 w-16 rounded-full' />
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-64' />
        <Skeleton className='h-10 w-32' />
      </div>
    </div>
  );
}
