"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
import { type Agent } from "@/components/agents/hooks/useAgentsData";

type Store = Agent;

interface StoreInfoCardProps {
  readonly store: Store;
  readonly isRefreshing: boolean;
  readonly isMobile: boolean;
  readonly onRefresh: () => void;
  readonly onEdit: () => void;
  readonly onToggleStatus: () => void;
  readonly children?: React.ReactNode;
}

export default function StoreInfoCard({
  store,
  isRefreshing,
  isMobile,
  onRefresh,
  onEdit,
  onToggleStatus,
  children,
}: StoreInfoCardProps) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-4'>
            <div className='p-3 rounded-full bg-primary/10'>
              <StoreIcon className='h-8 w-8 text-primary' />
            </div>
            <div>
              <CardTitle className='text-2xl flex items-center gap-2 flex-wrap'>
                {store.name}
                <Badge
                  variant={store.is_active ? "default" : "secondary"}
                  className={cn(
                    "ml-2",
                    store.is_active
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : "bg-red-100 text-red-800 hover:bg-red-100"
                  )}>
                  {store.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription className='flex items-center gap-4 mt-1 flex-wrap'>
                <span className='flex items-center gap-1'>
                  <MapPin className='h-3.5 w-3.5' />
                  {store.location}, {store.county}
                </span>
                <span className='flex items-center gap-1'>
                  <Phone className='h-3.5 w-3.5' />
                  {store.phone_number}
                </span>
              </CardDescription>
            </div>
          </div>

          {/* Store Actions */}
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={onRefresh}
              disabled={isRefreshing}
              className='gap-2 cursor-pointer'>
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
              {!isMobile && "Refresh"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='cursor-pointer'>
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
                  className='cursor-pointer'>
                  <Power className='mr-2 h-4 w-4' />
                  {store.is_active ? "Deactivate Store" : "Activate Store"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
