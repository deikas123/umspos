"use client";

import { Store as StoreIcon, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateStoreDialog from "./CreateStoreDialog";

export default function StoreEmptyState() {
  return (
    <div className='flex flex-col items-center justify-center p-12 text-gray-500'>
      <div className='relative mb-6'>
        <StoreIcon className='w-16 h-16 text-gray-300' />
        <span className='absolute -bottom-1 -right-1 flex h-4 w-4'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
          <span className='relative inline-flex rounded-full h-4 w-4 bg-primary'></span>
        </span>
      </div>
      <h3 className='text-lg font-semibold text-gray-700 mb-2'>
        No Store Registered
      </h3>
      <p className='text-sm text-gray-400 text-center max-w-md mb-6'>
        Create a store to manage your branch location inventory and track meter
        movements for your company&apos;s locations.
      </p>
      <CreateStoreDialog
        trigger={
          <Button className='gap-2 cursor-pointer'>
            <PlusCircle className='h-4 w-4' />
            Create Store
          </Button>
        }
      />
    </div>
  );
}
