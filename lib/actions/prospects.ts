"use server";

import { db } from "@/lib/db";
import { clientProspects } from "@/lib/db/schema";
import { eq, desc, count, and, or, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { headers } from "next/headers";
import {
  isSalesPerson,
  isAdmin,
  canManageProspects,
  canDeleteProspects,
} from "@/lib/utils/rolePermissions";

export interface ProspectFormData {
  client_name: string;
  location: string;
  contact: string;
  status:
    | "interested"
    | "not_interested"
    | "prospect"
    | "lead"
    | "presentation"
    | "quotation_sent"
    | "closed"
    | "lost";
  other_remarks?: string;
  meter_type: string;
  number_of_meters: number;
  latitude?: string;
  longitude?: string;
  place_name?: string;
}

type ChangeValue = string | number | null;

interface ChangeRecord {
  field: string;
  old_value: ChangeValue;
  new_value: ChangeValue;
}

interface ChangeHistoryEntry {
  timestamp: string;
  user_id: string;
  user_name: string;
  changes: ChangeRecord[];
}

export async function createProspect(formData: ProspectFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Unauthorized: You must be logged in",
    };
  }

  const userRole = (session.user as any).appRole;
  if (userRole !== "sales_person") {
    return {
      success: false as const,
      error: "Unauthorized: Only sales persons can create prospects",
    };
  }

  try {
    const newProspect = await db
      .insert(clientProspects)
      .values({
        sales_person_id: session.user.id,
        sales_person_name: session.user.name || "Unknown",
        client_name: formData.client_name,
        location: formData.location,
        contact: formData.contact,
        status: formData.status,
        other_remarks: formData.other_remarks || null,
        meter_type: formData.meter_type,
        number_of_meters: formData.number_of_meters,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        place_name: formData.place_name || null,
        change_history: [],
      })
      .returning();

    revalidatePath("/prospects");
    revalidatePath("/prospects/new");

    return { success: true as const, prospect: newProspect[0] };
  } catch (error: any) {
    console.error("Error creating prospect:", error);
    return {
      success: false as const,
      error: error.message || "Failed to create prospect",
    };
  }
}

export async function createMultipleProspects(
  prospectsData: ProspectFormData[],
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Unauthorized: You must be logged in",
    };
  }

  const userRole = (session.user as any).appRole;
  if (userRole !== "sales_person") {
    return {
      success: false as const,
      error: "Unauthorized: Only sales persons can create prospects",
    };
  }

  try {
    const prospectValues = prospectsData.map((formData) => ({
      sales_person_id: session.user.id,
      sales_person_name: session.user.name || "Unknown",
      client_name: formData.client_name,
      location: formData.location,
      contact: formData.contact,
      status: formData.status,
      other_remarks: formData.other_remarks || null,
      meter_type: formData.meter_type,
      number_of_meters: formData.number_of_meters,
      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
      place_name: formData.place_name || null,
      change_history: [],
    }));

    const newProspects = await db
      .insert(clientProspects)
      .values(prospectValues)
      .returning();

    revalidatePath("/prospects");
    revalidatePath("/prospects/new");

    return {
      success: true as const,
      prospects: newProspects,
      count: newProspects.length,
    };
  } catch (error: any) {
    console.error("Error creating prospects:", error);
    return {
      success: false as const,
      error: error.message || "Failed to create prospects",
    };
  }
}

export async function updateProspect(
  prospectId: string,
  formData: Partial<ProspectFormData>,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Unauthorized: You must be logged in",
    };
  }

  const userRole = (session.user as any).appRole;

  // Only sales_person who created it or admin/super_admin can update
  const existingProspect = await db
    .select()
    .from(clientProspects)
    .where(eq(clientProspects.id, prospectId))
    .limit(1);

  if (existingProspect.length === 0) {
    return { success: false as const, error: "Prospect not found" };
  }

  const prospect = existingProspect[0];

  if (isSalesPerson(userRole) && prospect.sales_person_id !== session.user.id) {
    return {
      success: false as const,
      error: "Unauthorized: You can only update your own prospects",
    };
  }

  if (!canManageProspects(userRole)) {
    return {
      success: false as const,
      error: "Unauthorized: Insufficient permissions",
    };
  }

  // Build change history entry
  const changes: ChangeHistoryEntry["changes"] = [];
  const fieldsToCheck: (keyof ProspectFormData)[] = [
    "client_name",
    "location",
    "contact",
    "status",
    "other_remarks",
    "meter_type",
    "number_of_meters",
  ];

  for (const field of fieldsToCheck) {
    if (formData[field] !== undefined) {
      const oldValue = prospect[field as keyof typeof prospect];
      const newValue = formData[field];
      if (oldValue !== newValue) {
        changes.push({
          field,
          old_value: oldValue as string | number | null,
          new_value: newValue as string | number | null,
        });
      }
    }
  }

  if (changes.length === 0) {
    return { success: true as const, prospect, message: "No changes detected" };
  }

  const changeHistoryEntry: ChangeHistoryEntry = {
    timestamp: new Date().toISOString(),
    user_id: session.user.id,
    user_name: session.user.name || "Unknown",
    changes,
  };

  const existingHistory =
    (prospect.change_history as ChangeHistoryEntry[]) || [];

  try {
    const updated = await db
      .update(clientProspects)
      .set({
        ...formData,
        updated_at: new Date(),
        change_history: [...existingHistory, changeHistoryEntry],
      })
      .where(eq(clientProspects.id, prospectId))
      .returning();

    revalidatePath("/prospects");
    revalidatePath("/prospects/new");

    return { success: true as const, prospect: updated[0] };
  } catch (error: any) {
    console.error("Error updating prospect:", error);
    return {
      success: false as const,
      error: error.message || "Failed to update prospect",
    };
  }
}

export async function getProspectById(prospectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const userRole = (session.user as any).appRole;

  try {
    const prospect = await db
      .select()
      .from(clientProspects)
      .where(eq(clientProspects.id, prospectId))
      .limit(1);

    if (prospect.length === 0) {
      throw new Error("Prospect not found");
    }

    // Sales person can only view their own prospects
    if (
      isSalesPerson(userRole) &&
      prospect[0].sales_person_id !== session.user.id
    ) {
      throw new Error("Unauthorized: You can only view your own prospects");
    }

    return prospect[0];
  } catch (error: any) {
    console.error("Error fetching prospect:", error);
    throw new Error(`Failed to fetch prospect: ${error.message}`);
  }
}

export async function deleteProspect(prospectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const userRole = (session.user as any).appRole;

  // Only admin or super_admin can delete
  if (!canDeleteProspects(userRole)) {
    throw new Error("Unauthorized: Only admins can delete prospects");
  }

  try {
    await db.delete(clientProspects).where(eq(clientProspects.id, prospectId));

    revalidatePath("/prospects");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting prospect:", error);
    throw new Error(`Failed to delete prospect: ${error.message}`);
  }
}

// ============================================
// PAGINATED QUERIES
// ============================================

type ProspectStatus =
  | "interested"
  | "not_interested"
  | "prospect"
  | "lead"
  | "presentation"
  | "quotation_sent"
  | "closed"
  | "lost";

export interface PaginatedProspectsParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: ProspectStatus | "all";
  salesPerson?: string;
}

export interface PaginatedProspectsResult {
  prospects: any[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function getMyProspectsPaginated(
  params: PaginatedProspectsParams,
): Promise<PaginatedProspectsResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const { page, pageSize, search, status } = params;
  const offset = (page - 1) * pageSize;

  try {
    // Build where conditions
    const conditions = [eq(clientProspects.sales_person_id, session.user.id)];

    if (status && status !== "all") {
      conditions.push(eq(clientProspects.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(clientProspects.client_name, `%${search}%`),
          ilike(clientProspects.location, `%${search}%`),
          ilike(clientProspects.contact, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(clientProspects)
      .where(whereClause);

    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get paginated prospects
    const prospects = await db
      .select()
      .from(clientProspects)
      .where(whereClause)
      .orderBy(desc(clientProspects.updated_at))
      .limit(pageSize)
      .offset(offset);

    return {
      prospects,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error: any) {
    console.error("Error fetching paginated prospects:", error);
    throw new Error(`Failed to fetch prospects: ${error.message}`);
  }
}

export async function getAllProspectsPaginated(
  params: PaginatedProspectsParams,
): Promise<PaginatedProspectsResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const userRole = (session.user as any).appRole;
  if (!isAdmin(userRole)) {
    throw new Error("Unauthorized: Only admins can view all prospects");
  }

  const { page, pageSize, search, status, salesPerson } = params;
  const offset = (page - 1) * pageSize;

  try {
    // Build where conditions
    const conditions: any[] = [];

    if (status && status !== "all") {
      conditions.push(eq(clientProspects.status, status));
    }

    if (salesPerson && salesPerson !== "all") {
      conditions.push(eq(clientProspects.sales_person_name, salesPerson));
    }

    if (search) {
      conditions.push(
        or(
          ilike(clientProspects.client_name, `%${search}%`),
          ilike(clientProspects.location, `%${search}%`),
          ilike(clientProspects.contact, `%${search}%`),
          ilike(clientProspects.sales_person_name, `%${search}%`),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(clientProspects)
      .where(whereClause);

    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get paginated prospects
    const prospects = await db
      .select({
        id: clientProspects.id,
        sales_person_id: clientProspects.sales_person_id,
        sales_person_name: clientProspects.sales_person_name,
        client_name: clientProspects.client_name,
        location: clientProspects.location,
        contact: clientProspects.contact,
        status: clientProspects.status,
        other_remarks: clientProspects.other_remarks,
        meter_type: clientProspects.meter_type,
        number_of_meters: clientProspects.number_of_meters,
        latitude: clientProspects.latitude,
        longitude: clientProspects.longitude,
        created_at: clientProspects.created_at,
        updated_at: clientProspects.updated_at,
        change_history: clientProspects.change_history,
      })
      .from(clientProspects)
      .where(whereClause)
      .orderBy(desc(clientProspects.updated_at))
      .limit(pageSize)
      .offset(offset);

    return {
      prospects,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error: any) {
    console.error("Error fetching all paginated prospects:", error);
    throw new Error(`Failed to fetch prospects: ${error.message}`);
  }
}

export async function getUniqueSalesPersons(): Promise<string[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const userRole = (session.user as any).appRole;
  if (!isAdmin(userRole)) {
    throw new Error("Unauthorized: Only admins can view sales persons");
  }

  try {
    const result = await db
      .selectDistinct({ sales_person_name: clientProspects.sales_person_name })
      .from(clientProspects)
      .orderBy(clientProspects.sales_person_name);

    return result.map((r) => r.sales_person_name);
  } catch (error: any) {
    console.error("Error fetching sales persons:", error);
    throw new Error(`Failed to fetch sales persons: ${error.message}`);
  }
}
