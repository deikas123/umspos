"use server";

import { db } from "@/lib/db";
import { clientProspects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { headers } from "next/headers";

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
    throw new Error("Unauthorized: You must be logged in");
  }

  const userRole = (session.user as any).appRole;
  if (userRole !== "sales_person") {
    throw new Error("Unauthorized: Only sales persons can create prospects");
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

    return { success: true, prospect: newProspect[0] };
  } catch (error: any) {
    console.error("Error creating prospect:", error);
    throw new Error(`Failed to create prospect: ${error.message}`);
  }
}

export async function createMultipleProspects(
  prospectsData: ProspectFormData[]
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const userRole = (session.user as any).appRole;
  if (userRole !== "sales_person") {
    throw new Error("Unauthorized: Only sales persons can create prospects");
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
      success: true,
      prospects: newProspects,
      count: newProspects.length,
    };
  } catch (error: any) {
    console.error("Error creating prospects:", error);
    throw new Error(`Failed to create prospects: ${error.message}`);
  }
}

export async function updateProspect(
  prospectId: string,
  formData: Partial<ProspectFormData>
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const userRole = (session.user as any).appRole;

  // Only sales_person who created it or admin/super_admin can update
  const existingProspect = await db
    .select()
    .from(clientProspects)
    .where(eq(clientProspects.id, prospectId))
    .limit(1);

  if (existingProspect.length === 0) {
    throw new Error("Prospect not found");
  }

  const prospect = existingProspect[0];

  if (
    userRole === "sales_person" &&
    prospect.sales_person_id !== session.user.id
  ) {
    throw new Error("Unauthorized: You can only update your own prospects");
  }

  if (!["sales_person", "admin", "super_admin"].includes(userRole)) {
    throw new Error("Unauthorized: Insufficient permissions");
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
    return { success: true, prospect, message: "No changes detected" };
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

    return { success: true, prospect: updated[0] };
  } catch (error: any) {
    console.error("Error updating prospect:", error);
    throw new Error(`Failed to update prospect: ${error.message}`);
  }
}

export async function getMyProspects() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  try {
    const prospects = await db
      .select()
      .from(clientProspects)
      .where(eq(clientProspects.sales_person_id, session.user.id))
      .orderBy(desc(clientProspects.updated_at));

    return prospects;
  } catch (error: any) {
    console.error("Error fetching prospects:", error);
    throw new Error(`Failed to fetch prospects: ${error.message}`);
  }
}

export async function getAllProspects() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const userRole = (session.user as any).appRole;
  if (!["admin", "super_admin"].includes(userRole)) {
    throw new Error("Unauthorized: Only admins can view all prospects");
  }

  try {
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
      .orderBy(desc(clientProspects.updated_at));

    return prospects;
  } catch (error: any) {
    console.error("Error fetching all prospects:", error);
    throw new Error(`Failed to fetch prospects: ${error.message}`);
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
      userRole === "sales_person" &&
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
  if (!["admin", "super_admin"].includes(userRole)) {
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
