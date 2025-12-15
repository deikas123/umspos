"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Edit2, Shield, UserMinus, UserPlus, MoreVertical } from "lucide-react";

interface UserActionsMenuProps {
  user: any;
  currentUser: any;
  onEditName: (user: any) => void;
  onChangePassword: (userId: string, userName: string) => void;
  onChangeRole: (user: any, role: string) => void;
  onToggleStatus: (user: any) => void;
}

export function UserActionsMenu({
  user,
  currentUser,
  onEditName,
  onChangePassword,
  onChangeRole,
  onToggleStatus,
}: Readonly<UserActionsMenuProps>) {
  if (!currentUser) return null;

  // Only show menu if it's the current user OR the current user is an admin or super_admin
  if (
    user.id !== currentUser.id &&
    currentUser.role !== "admin" &&
    currentUser.role !== "super_admin"
  ) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='cursor-pointer'>
          <MoreVertical className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {user.id === currentUser.id && (
          <DropdownMenuItem
            className='cursor-pointer'
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChangePassword(user.id, user.name);
            }}>
            <Edit2 className='mr-2 h-4 w-4' />
            Change Password
          </DropdownMenuItem>
        )}

        {(currentUser.role === "admin" || currentUser.role === "super_admin") &&
          user.id !== currentUser.id && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='cursor-pointer'
                onSelect={(e) => {
                  e.preventDefault();
                  onEditName(user);
                }}>
                <Edit2 className='mr-2 h-4 w-4' />
                Edit Name
              </DropdownMenuItem>

              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => onChangeRole(user, "super_admin")}
                disabled={user.role === "super_admin"}>
                <Shield className='mr-2 h-4 w-4 text-red-500' />
                Set as Super Admin
              </DropdownMenuItem>

              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => onChangeRole(user, "admin")}
                disabled={user.role === "admin"}>
                <Shield className='mr-2 h-4 w-4' />
                Set as Admin
              </DropdownMenuItem>

              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => onChangeRole(user, "accountant")}
                disabled={user.role === "accountant"}>
                <Shield className='mr-2 h-4 w-4 text-purple-500' />
                Set as Accountant
              </DropdownMenuItem>

              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => onChangeRole(user, "sales_person")}
                disabled={user.role === "sales_person"}>
                <Shield className='mr-2 h-4 w-4 text-blue-500' />
                Set as Sales Person
              </DropdownMenuItem>

              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => onChangeRole(user, "user")}
                disabled={user.role === "user"}>
                <Shield className='mr-2 h-4 w-4 text-yellow-500' />
                Set as User
              </DropdownMenuItem>

              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => onToggleStatus(user)}>
                {user.isActive ? (
                  <>
                    <UserMinus className='mr-2 h-4 w-4' />
                    Deactivate User
                  </>
                ) : (
                  <>
                    <UserPlus className='mr-2 h-4 w-4' />
                    Activate User
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => onChangePassword(user.id, user.name)}>
                <Edit2 className='mr-2 h-4 w-4 text-blue-500' />
                Change Password
              </DropdownMenuItem>
            </>
          )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
