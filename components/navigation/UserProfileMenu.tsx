"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, KeyRound, Shield, ChevronDown, Loader2 } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface UserProfileMenuProps {
  user: {
    id: string;
    name?: string | null;
    email?: string;
  } | null;
  userRole: string | null | undefined;
  updateAuthState: (state: any) => void;
}

export function UserProfileMenu({
  user,
  userRole,
  updateAuthState,
}: Readonly<UserProfileMenuProps>) {
  const [isLoading, setIsLoading] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] =
    useState(false);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await signOut();

      // Clear client state immediately
      queryClient.clear();
      updateAuthState({
        user: null,
        userRole: undefined,
        isAuthenticated: false,
        isLoading: false,
      });

      // Navigate immediately - the middleware will handle the rest
      globalThis.window.location.href = "/signin";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  const getRoleBadgeVariant = () => {
    if (userRole === "admin")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (userRole === "accountant")
      return "bg-violet-100 text-violet-700 border-violet-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  const getRoleIcon = () => {
    if (userRole === "admin") return <Shield className='h-3 w-3' />;
    return null;
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role?: string | null) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "accountant":
        return "Accountant";
      case "sales_person":
        return "Sales Person";
      case "user":
        return "User";
      default:
        return role ?? "User";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='group relative flex h-10 items-center gap-2 rounded-full border border-border bg-background/70 pl-1 pr-2 py-1 shadow-sm backdrop-blur-sm transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/30 cursor-pointer data-[state=open]:bg-accent/60'
            id='user-profile-button'>
            <Avatar className='h-8 w-8 border border-border'>
              <AvatarFallback className='bg-primary text-primary-foreground text-xs font-semibold'>
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-1 flex-col items-start leading-none'>
              <span className='max-w-[10rem] truncate text-sm font-medium text-foreground'>
                {user?.name?.split(" ")[0] ?? "Account"}
              </span>
            </div>
            <ChevronDown className='h-4 w-4 text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]:rotate-180' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-72 p-0 overflow-hidden'
          align='end'
          sideOffset={8}>
          {/* Header Section */}
          <div className='bg-gradient-to-br from-primary/5 via-blue-50 to-indigo-50 px-4 py-4 border-b border-slate-100'>
            <div className='flex items-start gap-3'>
              <Avatar className='h-12 w-12 border-2 border-white shadow-md'>
                <AvatarFallback className='bg-gradient-to-br from-primary to-blue-600 text-white text-base font-semibold'>
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1 min-w-0'>
                <p className='font-semibold text-slate-800 truncate'>
                  {user?.name}
                </p>
                <p className='text-xs text-slate-500 truncate mt-0.5'>
                  {user?.email}
                </p>
                <Badge
                  variant='outline'
                  className={`${getRoleBadgeVariant()} mt-2 text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 flex items-center gap-1 w-fit`}>
                  {getRoleIcon()}
                  {getRoleLabel(userRole)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className='py-2'>
            <DropdownMenuLabel className='px-4 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold'>
              Account
            </DropdownMenuLabel>
            <DropdownMenuItem
              className='mx-2 px-3 py-2.5 rounded-lg cursor-pointer focus:bg-slate-100 group'
              onClick={() => setShowChangePasswordDialog(true)}>
              <div className='flex items-center gap-3'>
                <div className='h-8 w-8 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center transition-colors'>
                  <KeyRound className='h-4 w-4 text-slate-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-slate-700'>
                    Change Password
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className='my-0' />

          {/* Logout */}
          <div className='p-2'>
            <DropdownMenuItem
              className='mx-0 px-3 py-2.5 rounded-lg cursor-pointer focus:bg-red-50 group'
              onClick={handleLogout}
              disabled={isLoading}>
              <div className='flex items-center gap-3 w-full'>
                <div className='h-8 w-8 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors'>
                  {isLoading ? (
                    <Loader2 className='h-4 w-4 text-red-600 animate-spin' />
                  ) : (
                    <LogOut className='h-4 w-4 text-red-600' />
                  )}
                </div>
                <div>
                  <p className='text-sm font-medium text-red-600'>
                    {isLoading ? "Signing out..." : "Sign Out"}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {user && (
        <ChangePasswordDialog
          open={showChangePasswordDialog}
          onOpenChange={setShowChangePasswordDialog}
          userId={user.id}
        />
      )}
    </>
  );
}
