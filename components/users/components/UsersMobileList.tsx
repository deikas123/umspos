"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserActionsMenu } from "./UserActionsMenu";

interface UsersMobileListProps {
  users: any[];
  currentUser: any;
  onEditName: (user: any) => void;
  onChangePassword: (userId: string, userName: string) => void;
  onChangeRole: (user: any, role: string) => void;
  onToggleStatus: (user: any) => void;
}

export function UsersMobileList({
  users,
  currentUser,
  onEditName,
  onChangePassword,
  onChangeRole,
  onToggleStatus,
}: Readonly<UsersMobileListProps>) {
  return (
    <div className='block md:hidden'>
      <Table className='w-full'>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className='font-medium'>
                <div className='flex items-center gap-2'>
                  {user.name}
                  {user.id === currentUser?.id && (
                    <Badge
                      variant='secondary'
                      className='bg-primary text-white'>
                      You
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <UserRoleBadge role={user.role} />
              </TableCell>
              <TableCell>
                <UserStatusBadge isActive={user.isActive} />
              </TableCell>
              <TableCell>
                <UserActionsMenu
                  user={user}
                  currentUser={currentUser}
                  onEditName={onEditName}
                  onChangePassword={onChangePassword}
                  onChangeRole={onChangeRole}
                  onToggleStatus={onToggleStatus}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
