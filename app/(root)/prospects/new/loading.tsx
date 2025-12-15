import { Skeleton } from "@/components/ui/skeleton";

export default function NewProspectLoading() {
  return (
    <div className='container mx-auto px-4 py-6 max-w-2xl'>
      <div className='flex flex-col gap-6'>
        {/* Page title */}
        <div className='text-center'>
          <Skeleton className='h-9 w-48 mx-auto' />
        </div>

        {/* Form skeleton */}
        <div className='rounded-lg border bg-card p-6 space-y-6'>
          {/* Form fields */}
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`field-${i}`} className='space-y-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-10 w-full' />
            </div>
          ))}

          {/* Submit button */}
          <div className='pt-4'>
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
      </div>
    </div>
  );
}
