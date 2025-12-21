"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Store as StoreIcon,
  MapPin,
  Phone,
  RefreshCw,
  MoreVertical,
  Edit,
  Power,
  PlusCircle,
  ArrowLeftCircle,
  ShoppingCart,
  Package,
} from "lucide-react";
import { type Agent } from "@/components/agents/hooks/useAgentsData";

type Store = Agent;

interface StoreHeaderProps {
  readonly store: Store;
  readonly inventoryCount: number;
  readonly isRefreshing: boolean;
  readonly isMobile: boolean;
  readonly onRefresh: () => void;
  readonly onEdit: () => void;
  readonly onToggleStatus: () => void;
  readonly onAssignMeters: () => void;
  readonly onReturnMeters: () => void;
  readonly onRecordSale: () => void;
}

export default function StoreHeader({
  store,
  inventoryCount,
  isRefreshing,
  isMobile,
  onRefresh,
  onEdit,
  onToggleStatus,
  onAssignMeters,
  onReturnMeters,
  onRecordSale,
}: StoreHeaderProps) {
  return (
    <Card>
      <CardContent className='py-4'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          {/* Store Identity */}
          <div className='flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-primary/10'>
              <StoreIcon className='h-6 w-6 text-primary' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-lg font-semibold'>{store.name}</h2>
                <Badge
                  variant='outline'
                  className={cn(
                    "text-xs",
                    store.is_active
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  )}>
                  {store.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className='flex items-center gap-3 text-muted-foreground text-sm mt-0.5'>
                <span className='flex items-center gap-1'>
                  <MapPin className='h-3.5 w-3.5' />
                  {store.location}, {store.county}
                </span>
                <span className='flex items-center gap-1'>
                  <Phone className='h-3.5 w-3.5' />
                  {store.phone_number}
                </span>
              </div>
            </div>
          </div>

          {/* Stats & Actions */}
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border'>
              <Package className='h-4 w-4 text-primary' />
              <span className='font-semibold'>{inventoryCount}</span>
              <span className='text-xs text-muted-foreground'>in stock</span>
            </div>

            <Button
              variant='ghost'
              size='icon'
              onClick={onRefresh}
              disabled={isRefreshing}
              className='cursor-pointer h-8 w-8'>
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='cursor-pointer h-8 w-8'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={onEdit} className='cursor-pointer'>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit Store
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onToggleStatus}
                  className={cn(
                    "cursor-pointer",
                    store.is_active
                      ? "text-destructive focus:text-destructive"
                      : "text-green-600 focus:text-green-600"
                  )}>
                  <Power className='mr-2 h-4 w-4' />
                  {store.is_active ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-2 mt-4 pt-4 border-t'>
          <Button
            size='sm'
            onClick={onRecordSale}
            className='gap-1.5 cursor-pointer bg-green-600 hover:bg-green-700'>
            <ShoppingCart className='h-4 w-4' />
            Record Sale
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onAssignMeters}
            className='gap-1.5 cursor-pointer'>
            <PlusCircle className='h-4 w-4' />
            Assign Meters
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onReturnMeters}
            className='gap-1.5 cursor-pointer'>
            <ArrowLeftCircle className='h-4 w-4' />
            Return Meters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
