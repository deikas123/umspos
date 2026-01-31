"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { changePassword, adminChangePassword } from "@/lib/actions/users";
import { useQueryClient } from "@tanstack/react-query";

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
  currentUser: any;
}

export function ChangePasswordDialog({
  isOpen,
  onOpenChange,
  userId,
  userName,
  currentUser,
}: Readonly<ChangePasswordDialogProps>) {
  const [newPassword, setNewPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const handleChangePassword = async () => {
    if (!userId || !newPassword.trim()) {
      toast.error("Password cannot be empty");
      return;
    }

    try {
      // Use different methods based on whether it's the current user or admin changing someone else's password
      const result =
        userId === currentUser?.id
          ? await changePassword(userId, newPassword)
          : await adminChangePassword(userId, newPassword);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        userId === currentUser?.id
          ? "Password changed successfully. Please sign in again."
          : "User password changed successfully.",
      );

      // If changing own password, clear cache and redirect
      if (userId === currentUser?.id) {
        // Clear any cached data
        queryClient.clear();

        // Redirect to signin page after a short delay
        setTimeout(() => {
          globalThis.location.href = "/signin";
        }, 1500);
      } else {
        // Just invalidate queries if admin changing someone else's password
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }

      onOpenChange(false);
      setNewPassword("");
    } catch (error: any) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='bg-gray-50 border-gray-200 px-2'>
        <DialogHeader>
          <DialogTitle>
            {userId === currentUser?.id
              ? "Change Your Password"
              : `Change Password for ${userName}`}
          </DialogTitle>
        </DialogHeader>
        <div className='relative'>
          <Input
            id='new-password'
            className='pe-9'
            placeholder='Enter new password'
            type={isVisible ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            className='absolute inset-y-px end-px flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer'
            type='button'
            onClick={toggleVisibility}
            aria-label={isVisible ? "Hide password" : "Show password"}
            aria-pressed={isVisible}
            aria-controls='new-password'>
            {isVisible ? (
              <EyeOff size={16} strokeWidth={2} aria-hidden='true' />
            ) : (
              <Eye size={16} strokeWidth={2} aria-hidden='true' />
            )}
          </button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant='outline'
              onClick={() => {
                setNewPassword("");
                onOpenChange(false);
              }}
              className='cursor-pointer'>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleChangePassword} className='cursor-pointer'>
            Change Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
