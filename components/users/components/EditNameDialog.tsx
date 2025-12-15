"use client";

import { useState, useEffect } from "react";
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

interface EditNameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSave: (userId: string, newName: string) => Promise<void>;
}

export function EditNameDialog({
  isOpen,
  onOpenChange,
  user,
  onSave,
}: Readonly<EditNameDialogProps>) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (user) {
      setNewName(user.name);
    }
  }, [user]);

  const handleSave = async () => {
    if (user && newName.trim()) {
      await onSave(user.id, newName);
      setNewName("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='bg-gray-50 border-gray-200 px-2'>
        <DialogHeader>
          <DialogTitle>Edit User Name</DialogTitle>
        </DialogHeader>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder='Enter new name'
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant='outline'
              onClick={() => {
                setNewName("");
                onOpenChange(false);
              }}
              className='cursor-pointer'>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} className='cursor-pointer'>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
