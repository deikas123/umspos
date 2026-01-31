"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, Phone, Shield, Power } from "lucide-react";
import { isAdmin, isSuperAdmin } from "@/lib/utils/rolePermissions";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  phoneNumber?: string;
}

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  currentUser: { id: string; role: string } | null;
  onSave: (
    userId: string,
    updates: {
      name?: string;
      role?: string;
      is_active?: boolean;
      phoneNumber?: string;
    },
  ) => Promise<void>;
  onChangePassword: (userId: string, userName: string) => void;
}

const ROLES = [
  { value: "user", label: "User", color: "text-yellow-600" },
  { value: "sales_person", label: "Sales Person", color: "text-blue-600" },
  { value: "accountant", label: "Accountant", color: "text-purple-600" },
  { value: "admin", label: "Admin", color: "text-gray-700" },
  { value: "super_admin", label: "Super Admin", color: "text-red-600" },
];

export function EditUserDialog({
  isOpen,
  onOpenChange,
  user,
  currentUser,
  onSave,
  onChangePassword,
}: Readonly<EditUserDialogProps>) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    role: "user",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phoneNumber: user.phoneNumber || "",
        role: user.role || "user",
        isActive: user.isActive ?? true,
      });
      setHasChanges(false);
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    if (user) {
      const changed =
        formData.name !== (user.name || "") ||
        formData.phoneNumber !== (user.phoneNumber || "") ||
        formData.role !== (user.role || "user") ||
        formData.isActive !== (user.isActive ?? true);
      setHasChanges(changed);
    }
  }, [formData, user]);

  if (!user || !currentUser) return null;

  const isCurrentUser = user.id === currentUser.id;
  const canEditRole = isAdmin(currentUser.role) && !isCurrentUser;
  const canEditStatus = isAdmin(currentUser.role) && !isCurrentUser;
  const canPromoteToSuperAdmin = isSuperAdmin(currentUser.role);
  const canEditBasicInfo = isAdmin(currentUser.role) && !isCurrentUser;

  // Filter available roles based on permissions
  const availableRoles = ROLES.filter((role) => {
    if (role.value === "super_admin" && !canPromoteToSuperAdmin) {
      return false;
    }
    return true;
  });

  const handleSave = async () => {
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      const updates: {
        name?: string;
        role?: string;
        is_active?: boolean;
        phoneNumber?: string;
      } = {};

      if (formData.name !== user.name) {
        updates.name = formData.name;
      }
      if (formData.phoneNumber !== (user.phoneNumber || "")) {
        updates.phoneNumber = formData.phoneNumber;
      }
      if (formData.role !== user.role && canEditRole) {
        updates.role = formData.role;
      }
      if (formData.isActive !== user.isActive && canEditStatus) {
        updates.is_active = formData.isActive;
      }

      await onSave(user.id, updates);
      onOpenChange(false);
    } catch {
      // Error is handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    onChangePassword(user.id, user.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md bg-white'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Edit User
          </DialogTitle>
          <DialogDescription>
            {isCurrentUser
              ? "You can only change your password from this menu."
              : `Update details for ${user.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Email (read-only) */}
          <div className='space-y-1.5'>
            <Label className='text-xs text-muted-foreground'>Email</Label>
            <p className='text-sm font-medium px-3 py-2 bg-muted rounded-md'>
              {user.email}
            </p>
          </div>

          {/* Name */}
          {canEditBasicInfo && (
            <div className='space-y-1.5'>
              <Label htmlFor='name' className='flex items-center gap-1.5'>
                <User className='h-3.5 w-3.5' />
                Name
              </Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Full name'
              />
            </div>
          )}

          {/* Phone Number */}
          {canEditBasicInfo && (
            <div className='space-y-1.5'>
              <Label htmlFor='phone' className='flex items-center gap-1.5'>
                <Phone className='h-3.5 w-3.5' />
                Phone Number
              </Label>
              <Input
                id='phone'
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder='+254...'
              />
            </div>
          )}

          {/* Role */}
          {canEditRole && (
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5'>
                <Shield className='h-3.5 w-3.5' />
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }>
                <SelectTrigger className='cursor-pointer'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem
                      key={role.value}
                      value={role.value}
                      className='cursor-pointer'>
                      <span className={role.color}>{role.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active Status */}
          {canEditStatus && (
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-2'>
                <Power
                  className={`h-4 w-4 ${
                    formData.isActive ? "text-green-600" : "text-red-500"
                  }`}
                />
                <div>
                  <Label htmlFor='active' className='text-sm font-medium'>
                    Account Status
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    {formData.isActive
                      ? "User can sign in"
                      : "User is blocked from signing in"}
                  </p>
                </div>
              </div>
              <Switch
                id='active'
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          )}

          {/* Change Password Button */}
          {isAdmin(currentUser.role) && (
            <Button
              type='button'
              variant='outline'
              className='w-full cursor-pointer'
              onClick={handleChangePassword}>
              Change Password
            </Button>
          )}

          {/* Info for current user */}
          {isCurrentUser && (
            <p className='text-xs text-muted-foreground text-center'>
              Contact an administrator to update your profile details.
            </p>
          )}
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className='cursor-pointer'>
            Cancel
          </Button>
          {canEditBasicInfo && (
            <Button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className='cursor-pointer'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
