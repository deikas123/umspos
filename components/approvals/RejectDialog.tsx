"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectDialogProps {
  open: boolean;
  rejectionReason: string;
  isRejecting: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RejectDialog({
  open,
  rejectionReason,
  isRejecting,
  onOpenChange,
  onReasonChange,
  onConfirm,
  onCancel,
}: Readonly<RejectDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Update Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this update request.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='rejectionReason'>Rejection Reason *</Label>
            <Textarea
              id='rejectionReason'
              placeholder='Enter the reason for rejection...'
              value={rejectionReason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={!rejectionReason.trim() || isRejecting}>
            {isRejecting ? "Rejecting..." : "Reject Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
