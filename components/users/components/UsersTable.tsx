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
import type { User, CurrentUser } from "../hooks/useUsersData";

interface UsersTableProps {
  users: User[];
  currentUser: CurrentUser | null | undefined;
  onEditUser: (user: User) => void;
  onChangePassword: (userId: string, userName: string) => void;
  onChangeRole: (user: User, role: string) => void;
  onToggleStatus: (user: User) => void;
}

export function UsersTable({
  users,
  currentUser,
  onEditUser,
  onChangePassword,
  onChangeRole,
  onToggleStatus,
}: Readonly<UsersTableProps>) {
  return (
    <div className='hidden md:block'>
      <Table className='w-full'>
        <TableHeader>
          <TableRow>
            <TableHead className='w-1/3'>Name</TableHead>
            <TableHead className='w-1/3'>Role</TableHead>
            <TableHead className='w-1/3'>Status</TableHead>
            <TableHead className='w-1/4'>Actions</TableHead>
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
                  onEditUser={onEditUser}
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
