"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PlusCircle, ArrowLeftCircle } from "lucide-react";
import AssignMetersToAgent from "@/components/agents/AssignMetersToAgent";
import ReturnMetersFromAgent from "@/components/agents/ReturnMetersFromAgent";
import { type Agent } from "@/components/agents/hooks/useAgentsData";

type Store = Agent;

interface CurrentUser {
  id: string;
  name?: string | null;
  email?: string;
  role?: string;
}

interface StoreQuickActionsProps {
  readonly store: Store;
  readonly currentUser: CurrentUser | null | undefined;
  readonly assignSheetOpen: boolean;
  readonly returnSheetOpen: boolean;
  readonly onAssignSheetChange: (open: boolean) => void;
  readonly onReturnSheetChange: (open: boolean) => void;
}

export default function StoreQuickActions({
  store,
  currentUser,
  assignSheetOpen,
  returnSheetOpen,
  onAssignSheetChange,
  onReturnSheetChange,
}: StoreQuickActionsProps) {
  if (!currentUser) return null;

  return (
    <div className='flex flex-wrap gap-2'>
      <Sheet open={assignSheetOpen} onOpenChange={onAssignSheetChange}>
        <SheetTrigger asChild>
          <Button variant='outline' className='gap-2 cursor-pointer'>
            <PlusCircle className='h-4 w-4' />
            Assign Meters to Store
          </Button>
        </SheetTrigger>
        <SheetContent
          side='right'
          className='w-full bg-white min-w-[40vw] overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>Assign Meters to {store.name}</SheetTitle>
          </SheetHeader>
          <AssignMetersToAgent
            currentUser={{
              id: currentUser.id,
              name: currentUser.name ?? undefined,
            }}
            preSelectedAgent={{
              id: store.id,
              name: store.name,
              location: store.location,
            }}
            isSheetOpen={assignSheetOpen}
            isStore={true}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={returnSheetOpen} onOpenChange={onReturnSheetChange}>
        <SheetTrigger asChild>
          <Button variant='outline' className='gap-2 cursor-pointer'>
            <ArrowLeftCircle className='h-4 w-4' />
            Return Meters from Store
          </Button>
        </SheetTrigger>
        <SheetContent
          side='right'
          className='w-full bg-white min-w-[40vw] overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>Return Meters from {store.name}</SheetTitle>
            <SheetDescription>
              Scan meters to return from this store to main inventory
            </SheetDescription>
          </SheetHeader>
          <ReturnMetersFromAgent
            agent={{
              id: store.id,
              name: store.name,
              location: store.location,
            }}
            currentUser={{
              id: currentUser.id,
              name: currentUser.name ?? undefined,
            }}
            isStore={true}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
