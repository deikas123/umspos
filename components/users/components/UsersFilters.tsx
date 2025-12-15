"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsersFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showDeactivated: boolean;
  onShowDeactivatedChange: (show: boolean) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalUsers: number;
}

export function UsersFilters({
  searchTerm,
  onSearchChange,
  showDeactivated,
  onShowDeactivatedChange,
  onRefresh,
  isRefreshing,
  totalUsers,
}: Readonly<UsersFiltersProps>) {
  return (
    <div className='mb-6 mt-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Switch
            id='show-deactivated'
            checked={showDeactivated}
            onCheckedChange={onShowDeactivatedChange}
          />
          <Label htmlFor='show-deactivated'>Show deactivated users</Label>
        </div>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='icon'
            onClick={onRefresh}
            className='hover:bg-gray-100 cursor-pointer'
            disabled={isRefreshing}
            aria-label='Refresh users list'>
            <RefreshCw
              className={cn(
                "h-4 w-4 transition-transform",
                isRefreshing && "animate-spin"
              )}
            />
          </Button>
          <div className='text-sm text-muted-foreground font-medium'>
            Total: {totalUsers} users
          </div>
        </div>
      </div>

      <div className='relative w-full md:w-72'>
        <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search users...'
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-8'
        />
      </div>
    </div>
  );
}
