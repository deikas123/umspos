"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  AlertCircle,
  User,
  Package,
  Hash,
  MapPin,
  Users,
  Building2,
  Pencil,
  UserPlus,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createSaleUpdateRequest,
  getPendingUpdateRequestForBatch,
  approveUpdateRequest,
} from "@/lib/actions/sale-updates";
import { updateSaleBatchPickupInfo } from "@/lib/actions/sales";
import { useAuth } from "@/contexts/AuthContext";

import type { SaleBatch } from "./hooks/useMeterSalesData";

const editSaleSchema = z.object({
  saleDate: z.date().optional(),
  unitPrice: z.number().min(0, "Unit price must be positive").optional(),
  updateReason: z
    .string()
    .min(10, "Please provide a detailed reason (at least 10 characters)"),
});

type EditSaleFormData = z.infer<typeof editSaleSchema>;

interface EditSaleDialogProps {
  batch: SaleBatch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditSaleDialog({
  batch,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<EditSaleDialogProps>) {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = userRole === "super_admin";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isCheckingPending, setIsCheckingPending] = useState(true);
  const [calculatedTotal, setCalculatedTotal] = useState(batch.total_price);

  // Pickup info state (can be edited directly without approval)
  const [pickedByType, setPickedByType] = useState<string>(
    batch.picked_by_type || ""
  );
  const [pickedByName, setPickedByName] = useState<string>(
    batch.picked_by_name || ""
  );
  const [pickedByContact, setPickedByContact] = useState<string>(
    batch.picked_by_contact || ""
  );
  const [isSavingPickup, setIsSavingPickup] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditSaleFormData>({
    resolver: zodResolver(editSaleSchema),
    defaultValues: {
      saleDate: batch.sale_date ? new Date(batch.sale_date) : undefined,
      unitPrice: batch.unit_price,
      updateReason: "",
    },
  });

  const watchedUnitPrice = watch("unitPrice");
  const watchedSaleDate = watch("saleDate");

  // Check for pending requests when dialog opens
  useEffect(() => {
    if (open) {
      setIsCheckingPending(true);
      getPendingUpdateRequestForBatch(batch.id)
        .then((request) => {
          setHasPendingRequest(!!request);
        })
        .catch(console.error)
        .finally(() => {
          setIsCheckingPending(false);
        });
    }
  }, [open, batch.id]);

  // Calculate total when unit price changes
  useEffect(() => {
    if (watchedUnitPrice !== undefined) {
      setCalculatedTotal(watchedUnitPrice * batch.batch_amount);
    }
  }, [watchedUnitPrice, batch.batch_amount]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        saleDate: batch.sale_date ? new Date(batch.sale_date) : undefined,
        unitPrice: batch.unit_price,
        updateReason: "",
      });
      setCalculatedTotal(batch.total_price);
      // Reset pickup fields
      setPickedByType(batch.picked_by_type || "");
      setPickedByName(batch.picked_by_name || "");
      setPickedByContact(batch.picked_by_contact || "");
    }
  }, [open, batch, reset]);

  const hasChanges = useCallback(() => {
    const originalDate = batch.sale_date
      ? new Date(batch.sale_date).getTime()
      : null;
    const newDate = watchedSaleDate ? watchedSaleDate.getTime() : null;
    const dateChanged = originalDate !== newDate;
    const priceChanged = watchedUnitPrice !== batch.unit_price;
    return dateChanged || priceChanged;
  }, [batch, watchedSaleDate, watchedUnitPrice]);

  const hasPickupChanges = useCallback(() => {
    const typeChanged = pickedByType !== (batch.picked_by_type || "");
    const nameChanged = pickedByName !== (batch.picked_by_name || "");
    const contactChanged = pickedByContact !== (batch.picked_by_contact || "");
    return typeChanged || nameChanged || contactChanged;
  }, [batch, pickedByType, pickedByName, pickedByContact]);

  const handleSavePickupInfo = async () => {
    if (!user) {
      toast.error("You must be logged in to update pickup info");
      return;
    }

    if (!hasPickupChanges()) {
      toast.info("No pickup changes to save");
      return;
    }

    setIsSavingPickup(true);
    try {
      await updateSaleBatchPickupInfo({
        batchId: batch.id,
        pickedByType: pickedByType || null,
        pickedByName: pickedByName || null,
        pickedByContact: pickedByContact || null,
        updatedBy: user.id,
      });
      toast.success("Pickup information updated");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update pickup info:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update pickup info"
      );
    } finally {
      setIsSavingPickup(false);
    }
  };

  const onSubmit = async (data: EditSaleFormData) => {
    if (!user) {
      toast.error("You must be logged in to submit updates");
      return;
    }

    if (!hasChanges()) {
      toast.error("No changes detected");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the update request first
      const updateRequest = await createSaleUpdateRequest({
        saleBatchId: batch.id,
        requestedBy: user.id,
        requestedByName: user.name || "Unknown",
        updateReason: data.updateReason,
        newSaleDate: data.saleDate,
        newUnitPrice: data.unitPrice,
        batchAmount: batch.batch_amount,
        currentValues: {
          sale_date: batch.sale_date,
          unit_price: batch.unit_price,
          total_price: batch.total_price,
        },
      });

      // If user is super_admin, auto-approve the request
      if (isSuperAdmin && updateRequest?.id) {
        await approveUpdateRequest({
          requestId: updateRequest.id,
          approvedBy: user.id,
          approvedByName: user.name || "Unknown",
        });

        // Ensure the pending-request indicator clears immediately
        queryClient.setQueryData<string[]>(
          ["pendingUpdateRequestBatchIds"],
          (prev) => (prev ?? []).filter((id) => id !== batch.id)
        );
        queryClient.invalidateQueries({
          queryKey: ["pendingUpdateRequestBatchIds"],
        });

        toast.success("Sale record updated successfully");
      } else {
        // Show pending-request indicator immediately
        queryClient.setQueryData<string[]>(
          ["pendingUpdateRequestBatchIds"],
          (prev) => {
            const next = prev ?? [];
            return next.includes(batch.id) ? next : [...next, batch.id];
          }
        );
        queryClient.invalidateQueries({
          queryKey: ["pendingUpdateRequestBatchIds"],
        });

        toast.success("Update request submitted for approval");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to submit update request:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit update request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDialogContent = () => {
    if (isCheckingPending) {
      return (
        <div className='flex-1 flex items-center justify-center py-16'>
          <div className='flex flex-col items-center gap-3'>
            <Loader2 className='h-10 w-10 animate-spin text-[#000080]/60' />
            <p className='text-sm text-muted-foreground'>Loading...</p>
          </div>
        </div>
      );
    }

    if (hasPendingRequest) {
      return (
        <div className='flex-1 flex flex-col items-center justify-center gap-5 text-center py-16 px-8'>
          <div className='w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center'>
            <AlertCircle className='h-10 w-10 text-amber-500' />
          </div>
          <div className='space-y-2'>
            <h3 className='text-xl font-semibold text-gray-900'>
              Pending Update Request
            </h3>
            <p className='text-muted-foreground max-w-sm'>
              There is already a pending update request for this sale record.
              Please wait for it to be processed before submitting a new one.
            </p>
          </div>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='mt-2'>
            Close
          </Button>
        </div>
      );
    }

    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col min-h-0 flex-1'>
        <div className='flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0'>
          {/* Sale Details Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='w-1 h-5 bg-[#000080] rounded-full' />
              <h3 className='font-semibold text-gray-900'>Sale Details</h3>
              <Badge variant='secondary' className='ml-auto text-xs'>
                Read-only
              </Badge>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                <User className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground'>Seller</p>
                  <p className='font-medium text-sm truncate'>
                    {batch.user_name}
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                <Package className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground'>Meter Type</p>
                  <p className='font-medium text-sm capitalize'>
                    {batch.meter_type}
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                <Hash className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground'>Quantity</p>
                  <p className='font-medium text-sm'>{batch.batch_amount}</p>
                </div>
              </div>

              <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                <MapPin className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground'>Recipient</p>
                  <p className='font-medium text-sm truncate'>
                    {batch.recipient}
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                <Users className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground'>Customer Type</p>
                  <p className='font-medium text-sm capitalize'>
                    {batch.customer_type || "-"}
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                <Building2 className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground'>County</p>
                  <p className='font-medium text-sm'>
                    {batch.customer_county || "-"}
                  </p>
                </div>
              </div>

              {batch.referral_name && (
                <div className='flex items-start gap-3 p-3 bg-amber-50 rounded-lg col-span-2'>
                  <UserPlus className='h-4 w-4 text-amber-600 mt-0.5 shrink-0' />
                  <div className='min-w-0'>
                    <p className='text-xs text-muted-foreground'>Referred By</p>
                    <p className='font-medium text-sm text-amber-700'>
                      {batch.referral_name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Editable Fields Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='w-1 h-5 bg-[#000080] rounded-full' />
              <h3 className='font-semibold text-gray-900'>Edit Fields</h3>
              <Pencil className='h-3.5 w-3.5 text-muted-foreground ml-1' />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='saleDate' className='text-sm font-medium'>
                  Sale Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !watchedSaleDate && "text-muted-foreground"
                      )}>
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {watchedSaleDate
                        ? format(watchedSaleDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={watchedSaleDate}
                      onSelect={(date) => setValue("saleDate", date)}
                      disabled={(date) => date > new Date()}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='unitPrice' className='text-sm font-medium'>
                  Unit Price (KES)
                </Label>
                <Input
                  id='unitPrice'
                  type='number'
                  step='0.01'
                  min='0'
                  {...register("unitPrice", { valueAsNumber: true })}
                  className={cn("h-10", errors.unitPrice && "border-red-500")}
                />
                {errors.unitPrice && (
                  <p className='text-xs text-red-500'>
                    {errors.unitPrice.message}
                  </p>
                )}
              </div>
            </div>

            {/* Calculated Total Card */}
            <div className='p-4 bg-[#000080]/5 rounded-lg border border-[#000080]/10'>
              <div className='flex justify-between items-center'>
                <div>
                  <p className='text-xs text-muted-foreground mb-0.5'>
                    Calculated Total
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {batch.batch_amount} units × KES{" "}
                    {(watchedUnitPrice ?? batch.unit_price).toLocaleString()}
                  </p>
                </div>
                <span className='text-2xl font-bold text-[#000080]'>
                  KES {calculatedTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='updateReason' className='text-sm font-medium'>
                Reason for Update <span className='text-red-500'>*</span>
              </Label>
              <Textarea
                id='updateReason'
                placeholder='Please explain why this update is needed...'
                rows={3}
                {...register("updateReason")}
                className={cn(
                  "resize-none",
                  errors.updateReason && "border-red-500"
                )}
              />
              {errors.updateReason && (
                <p className='text-xs text-red-500'>
                  {errors.updateReason.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Pickup Information Section - Direct Edit */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='w-1 h-5 bg-green-600 rounded-full' />
              <h3 className='font-semibold text-gray-900'>
                Pickup Information
              </h3>
              <Badge variant='outline' className='ml-auto text-xs bg-green-50'>
                Direct edit
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground -mt-2'>
              Pickup details can be added or updated without approval
            </p>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Picked By</Label>
                <Select value={pickedByType} onValueChange={setPickedByType}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='customer'>
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4' />
                        Customer
                      </div>
                    </SelectItem>
                    <SelectItem value='rider'>
                      <div className='flex items-center gap-2'>
                        <Truck className='h-4 w-4' />
                        Rider
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Name</Label>
                <Input
                  placeholder='Enter name'
                  value={pickedByName}
                  onChange={(e) => setPickedByName(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Contact</Label>
                <Input
                  type='tel'
                  placeholder='Enter contact'
                  value={pickedByContact}
                  onChange={(e) => setPickedByContact(e.target.value)}
                />
              </div>
            </div>

            <Button
              type='button'
              variant='outline'
              onClick={handleSavePickupInfo}
              disabled={isSavingPickup || !hasPickupChanges()}
              className='w-full md:w-auto border-green-600 text-green-600 hover:bg-green-50'>
              {isSavingPickup && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {isSavingPickup ? "Saving..." : "Save Pickup Info"}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className='shrink-0 px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3'>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting || !hasChanges()}
            className='bg-[#000080] hover:bg-[#000066] min-w-[140px]'>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isSubmitting && isSuperAdmin && "Updating..."}
            {isSubmitting && !isSuperAdmin && "Submitting..."}
            {!isSubmitting && isSuperAdmin && "Update Sale"}
            {!isSubmitting && !isSuperAdmin && "Submit for Approval"}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-xl flex flex-col p-0 gap-0 bg-white overflow-hidden'>
        <DialogHeader className='shrink-0 px-6 py-5 border-b'>
          <DialogTitle className='text-lg'>Edit Sale Record</DialogTitle>
          <DialogDescription className='text-sm'>
            {isSuperAdmin
              ? "Make changes to this sale record. Changes will be applied immediately."
              : "Request changes to this sale record. Changes require admin approval."}
          </DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
