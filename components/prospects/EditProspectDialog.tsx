"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProspect, ProspectFormData } from "@/lib/actions/prospects";
import { PROSPECT_STATUS_OPTIONS, METER_TYPE_OPTIONS } from "./types";
import type { ClientProspect } from "@/lib/db/schema";

type ProspectStatus = ProspectFormData["status"];

interface EditProspectDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly prospect: ClientProspect;
  readonly onSuccess: () => void;
}

export function EditProspectDialog({
  open,
  onOpenChange,
  prospect,
  onSuccess,
}: EditProspectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    client_name: string;
    location: string;
    contact: string;
    status: ProspectStatus;
    other_remarks: string;
    meter_type: string;
    number_of_meters: number;
  }>({
    client_name: prospect.client_name,
    location: prospect.location,
    contact: prospect.contact,
    status: prospect.status,
    other_remarks: prospect.other_remarks || "",
    meter_type: prospect.meter_type,
    number_of_meters: prospect.number_of_meters,
  });

  const handleSubmit = async () => {
    if (!formData.client_name.trim()) {
      toast.error("Client name is required");
      return;
    }
    if (!formData.location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!formData.contact.trim()) {
      toast.error("Contact is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateProspect(prospect.id, {
        client_name: formData.client_name.trim(),
        location: formData.location.trim(),
        contact: formData.contact.trim(),
        status: formData.status as any,
        other_remarks: formData.other_remarks.trim() || undefined,
        meter_type: formData.meter_type,
        number_of_meters: formData.number_of_meters,
      });

      if (result.success) {
        toast.success(result.message || "Prospect updated successfully");
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error updating prospect:", error);
      toast.error(error.message || "Failed to update prospect");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg bg-white max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Prospect</DialogTitle>
          <DialogDescription>
            Update the details for {prospect.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit_client_name'>Client Name *</Label>
            <Input
              id='edit_client_name'
              value={formData.client_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  client_name: e.target.value,
                }))
              }
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit_location'>Location *</Label>
            <Input
              id='edit_location'
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit_contact'>Contact *</Label>
            <Input
              id='edit_contact'
              value={formData.contact}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contact: e.target.value }))
              }
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit_status'>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: ProspectStatus) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }>
              <SelectTrigger id='edit_status'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROSPECT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit_meter_type'>Meter Type</Label>
            <Select
              value={formData.meter_type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, meter_type: value }))
              }>
              <SelectTrigger id='edit_meter_type'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METER_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit_number_of_meters'>Number of Meters</Label>
            <Input
              id='edit_number_of_meters'
              type='number'
              min={0}
              value={formData.number_of_meters}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  number_of_meters: Number.parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit_other_remarks'>Other Remarks</Label>
            <Textarea
              id='edit_other_remarks'
              value={formData.other_remarks}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  other_remarks: e.target.value,
                }))
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
