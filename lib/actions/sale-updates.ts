"use server";

import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import {
  saleBatches,
  saleBatchUpdateRequests,
  saleBatchAuditLog,
} from "../db/schema";
import { revalidatePath } from "next/cache";

export interface UpdateRequestChanges {
  sale_date?: { old: Date | null; new: Date };
  unit_price?: { old: number; new: number };
  total_price?: { old: number; new: number };
}

export interface CreateUpdateRequestParams {
  saleBatchId: string;
  requestedBy: string;
  requestedByName: string;
  updateReason: string;
  newSaleDate?: Date;
  newUnitPrice?: number;
  batchAmount: number;
  currentValues: {
    sale_date: Date | null;
    unit_price: number;
    total_price: number;
  };
}

export async function createSaleUpdateRequest(
  params: CreateUpdateRequestParams
) {
  const {
    saleBatchId,
    requestedBy,
    requestedByName,
    updateReason,
    newSaleDate,
    newUnitPrice,
    batchAmount,
    currentValues,
  } = params;

  // Build the changes object
  const changes: UpdateRequestChanges = {};
  let newTotalPrice: number | undefined;

  if (
    newSaleDate &&
    newSaleDate.getTime() !== currentValues.sale_date?.getTime()
  ) {
    changes.sale_date = {
      old: currentValues.sale_date,
      new: newSaleDate,
    };
  }

  if (newUnitPrice !== undefined && newUnitPrice !== currentValues.unit_price) {
    newTotalPrice = newUnitPrice * batchAmount;
    changes.unit_price = {
      old: currentValues.unit_price,
      new: newUnitPrice,
    };
    changes.total_price = {
      old: currentValues.total_price,
      new: newTotalPrice,
    };
  }

  if (Object.keys(changes).length === 0) {
    throw new Error("No changes detected");
  }

  // Check for existing pending request for this batch
  const [existingRequest] = await db
    .select()
    .from(saleBatchUpdateRequests)
    .where(
      and(
        eq(saleBatchUpdateRequests.sale_batch_id, saleBatchId),
        eq(saleBatchUpdateRequests.status, "pending")
      )
    )
    .limit(1);

  if (existingRequest) {
    throw new Error("There is already a pending update request for this sale");
  }

  // Create the update request
  const [updateRequest] = await db
    .insert(saleBatchUpdateRequests)
    .values({
      sale_batch_id: saleBatchId,
      requested_by: requestedBy,
      requested_by_name: requestedByName,
      update_reason: updateReason,
      changes: changes,
      new_sale_date: newSaleDate,
      new_unit_price: newUnitPrice?.toString(),
      new_total_price: newTotalPrice?.toString(),
    })
    .returning();

  // Create audit log entry
  await db.insert(saleBatchAuditLog).values({
    sale_batch_id: saleBatchId,
    action: "update_requested",
    performed_by: requestedBy,
    performed_by_name: requestedByName,
    old_values: currentValues,
    new_values: {
      sale_date: newSaleDate ?? currentValues.sale_date,
      unit_price: newUnitPrice ?? currentValues.unit_price,
      total_price: newTotalPrice ?? currentValues.total_price,
    },
    update_request_id: updateRequest.id,
    note: updateReason,
  });

  revalidatePath("/sales");
  revalidatePath("/approvals");

  return updateRequest;
}

export async function getPendingUpdateRequestBatchIds(): Promise<string[]> {
  const requests = await db
    .select({
      sale_batch_id: saleBatchUpdateRequests.sale_batch_id,
    })
    .from(saleBatchUpdateRequests)
    .where(eq(saleBatchUpdateRequests.status, "pending"));

  return requests.map((r) => r.sale_batch_id);
}

export async function getPendingUpdateRequests() {
  const requests = await db
    .select({
      id: saleBatchUpdateRequests.id,
      sale_batch_id: saleBatchUpdateRequests.sale_batch_id,
      requested_by: saleBatchUpdateRequests.requested_by,
      requested_by_name: saleBatchUpdateRequests.requested_by_name,
      requested_at: saleBatchUpdateRequests.requested_at,
      status: saleBatchUpdateRequests.status,
      update_reason: saleBatchUpdateRequests.update_reason,
      changes: saleBatchUpdateRequests.changes,
      new_sale_date: saleBatchUpdateRequests.new_sale_date,
      new_unit_price: saleBatchUpdateRequests.new_unit_price,
      new_total_price: saleBatchUpdateRequests.new_total_price,
      // Sale batch info
      batch_user_name: saleBatches.user_name,
      batch_meter_type: saleBatches.meter_type,
      batch_amount: saleBatches.batch_amount,
      batch_recipient: saleBatches.recipient,
      batch_destination: saleBatches.destination,
      current_sale_date: saleBatches.sale_date,
      current_unit_price: saleBatches.unit_price,
      current_total_price: saleBatches.total_price,
    })
    .from(saleBatchUpdateRequests)
    .innerJoin(
      saleBatches,
      eq(saleBatchUpdateRequests.sale_batch_id, saleBatches.id)
    )
    .where(eq(saleBatchUpdateRequests.status, "pending"))
    .orderBy(desc(saleBatchUpdateRequests.requested_at));

  return requests;
}

export async function getAllUpdateRequests(
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;

  const requests = await db
    .select({
      id: saleBatchUpdateRequests.id,
      sale_batch_id: saleBatchUpdateRequests.sale_batch_id,
      requested_by: saleBatchUpdateRequests.requested_by,
      requested_by_name: saleBatchUpdateRequests.requested_by_name,
      requested_at: saleBatchUpdateRequests.requested_at,
      status: saleBatchUpdateRequests.status,
      approved_by: saleBatchUpdateRequests.approved_by,
      approved_by_name: saleBatchUpdateRequests.approved_by_name,
      approved_at: saleBatchUpdateRequests.approved_at,
      rejection_reason: saleBatchUpdateRequests.rejection_reason,
      update_reason: saleBatchUpdateRequests.update_reason,
      changes: saleBatchUpdateRequests.changes,
      new_sale_date: saleBatchUpdateRequests.new_sale_date,
      new_unit_price: saleBatchUpdateRequests.new_unit_price,
      new_total_price: saleBatchUpdateRequests.new_total_price,
      // Sale batch info
      batch_user_name: saleBatches.user_name,
      batch_meter_type: saleBatches.meter_type,
      batch_amount: saleBatches.batch_amount,
      batch_recipient: saleBatches.recipient,
      batch_destination: saleBatches.destination,
    })
    .from(saleBatchUpdateRequests)
    .innerJoin(
      saleBatches,
      eq(saleBatchUpdateRequests.sale_batch_id, saleBatches.id)
    )
    .orderBy(desc(saleBatchUpdateRequests.requested_at))
    .limit(limit)
    .offset(offset);

  return requests;
}

export interface ApproveUpdateRequestParams {
  requestId: string;
  approvedBy: string;
  approvedByName: string;
}

export async function approveUpdateRequest(params: ApproveUpdateRequestParams) {
  const { requestId, approvedBy, approvedByName } = params;

  // Get the update request
  const [request] = await db
    .select()
    .from(saleBatchUpdateRequests)
    .where(eq(saleBatchUpdateRequests.id, requestId))
    .limit(1);

  if (!request) {
    throw new Error("Update request not found");
  }

  if (request.status !== "pending") {
    throw new Error("This request has already been processed");
  }

  // Get current sale batch values for audit log
  const [currentBatch] = await db
    .select()
    .from(saleBatches)
    .where(eq(saleBatches.id, request.sale_batch_id))
    .limit(1);

  if (!currentBatch) {
    throw new Error("Sale batch not found");
  }

  // Apply the updates to the sale batch
  const updateValues: {
    sale_date?: Date;
    unit_price?: string;
    total_price?: string;
  } = {};

  if (request.new_sale_date) {
    updateValues.sale_date = request.new_sale_date;
  }
  if (request.new_unit_price) {
    updateValues.unit_price = request.new_unit_price;
  }
  if (request.new_total_price) {
    updateValues.total_price = request.new_total_price;
  }

  // Update the sale batch
  await db
    .update(saleBatches)
    .set(updateValues)
    .where(eq(saleBatches.id, request.sale_batch_id));

  // Update the request status
  await db
    .update(saleBatchUpdateRequests)
    .set({
      status: "approved",
      approved_by: approvedBy,
      approved_by_name: approvedByName,
      approved_at: new Date(),
    })
    .where(eq(saleBatchUpdateRequests.id, requestId));

  // Create audit log entry for approval
  await db.insert(saleBatchAuditLog).values({
    sale_batch_id: request.sale_batch_id,
    action: "update_approved",
    performed_by: approvedBy,
    performed_by_name: approvedByName,
    old_values: {
      sale_date: currentBatch.sale_date,
      unit_price: Number(currentBatch.unit_price),
      total_price: Number(currentBatch.total_price),
    },
    new_values: {
      sale_date: request.new_sale_date ?? currentBatch.sale_date,
      unit_price: request.new_unit_price
        ? Number(request.new_unit_price)
        : Number(currentBatch.unit_price),
      total_price: request.new_total_price
        ? Number(request.new_total_price)
        : Number(currentBatch.total_price),
    },
    update_request_id: requestId,
    note: `Approved by ${approvedByName}`,
  });

  revalidatePath("/sales");
  revalidatePath("/approvals");

  return { success: true };
}

export interface RejectUpdateRequestParams {
  requestId: string;
  rejectedBy: string;
  rejectedByName: string;
  rejectionReason: string;
}

export async function rejectUpdateRequest(params: RejectUpdateRequestParams) {
  const { requestId, rejectedBy, rejectedByName, rejectionReason } = params;

  // Get the update request
  const [request] = await db
    .select()
    .from(saleBatchUpdateRequests)
    .where(eq(saleBatchUpdateRequests.id, requestId))
    .limit(1);

  if (!request) {
    throw new Error("Update request not found");
  }

  if (request.status !== "pending") {
    throw new Error("This request has already been processed");
  }

  // Update the request status
  await db
    .update(saleBatchUpdateRequests)
    .set({
      status: "rejected",
      approved_by: rejectedBy,
      approved_by_name: rejectedByName,
      approved_at: new Date(),
      rejection_reason: rejectionReason,
    })
    .where(eq(saleBatchUpdateRequests.id, requestId));

  // Create audit log entry for rejection
  await db.insert(saleBatchAuditLog).values({
    sale_batch_id: request.sale_batch_id,
    action: "update_rejected",
    performed_by: rejectedBy,
    performed_by_name: rejectedByName,
    update_request_id: requestId,
    note: rejectionReason,
  });

  revalidatePath("/sales");
  revalidatePath("/approvals");

  return { success: true };
}

export async function getSaleBatchAuditLog(saleBatchId: string) {
  const logs = await db
    .select()
    .from(saleBatchAuditLog)
    .where(eq(saleBatchAuditLog.sale_batch_id, saleBatchId))
    .orderBy(desc(saleBatchAuditLog.performed_at));

  return logs;
}

export async function getPendingUpdateRequestForBatch(saleBatchId: string) {
  const [request] = await db
    .select()
    .from(saleBatchUpdateRequests)
    .where(
      and(
        eq(saleBatchUpdateRequests.sale_batch_id, saleBatchId),
        eq(saleBatchUpdateRequests.status, "pending")
      )
    )
    .limit(1);

  return request ?? null;
}
