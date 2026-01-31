"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit2, MoreVertical, Key } from "lucide-react";
import { isAdmin } from "@/lib/utils/rolePermissions";

interface UserActionsMenuProps {
  user: any;
  currentUser: any;
  onEditUser: (user: any) => void;
  onChangePassword: (userId: string, userName: string) => void;
  onChangeRole: (user: any, role: string) => void;
  onToggleStatus: (user: any) => void;
}

export function UserActionsMenu({
  user,
  currentUser,
  onEditUser,
  onChangePassword,
}: Readonly<UserActionsMenuProps>) {
  if (!currentUser) return null;

  // Only show menu if it's the current user OR the current user is an admin or super_admin
  if (user.id !== currentUser.id && !isAdmin(currentUser.role)) {
    return null;
  }

  const isCurrentUser = user.id === currentUser.id;
  const canEditOthers = isAdmin(currentUser.role) && !isCurrentUser;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='cursor-pointer'>
          <MoreVertical className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {/* Current user can only change their own password */}
        {isCurrentUser && (
          <DropdownMenuItem
            className='cursor-pointer'
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChangePassword(user.id, user.name);
            }}>
            <Key className='mr-2 h-4 w-4' />
            Change Password
          </DropdownMenuItem>
        )}

        {/* Admins can edit other users through the comprehensive dialog */}
        {canEditOthers && (
          <DropdownMenuItem
            className='cursor-pointer'
            onSelect={(e) => {
              e.preventDefault();
              onEditUser(user);
            }}>
            <Edit2 className='mr-2 h-4 w-4' />
            Edit User
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
