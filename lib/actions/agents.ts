"use server";

import {
  eq,
  and,
  sql,
  desc,
  inArray,
  ilike,
  count,
  gte,
  lte,
} from "drizzle-orm";
import { db } from "../db";
import { withTimeout } from "../db/utils";
import {
  agents,
  agentInventory,
  agentTransactions,
  meters,
} from "../db/schema";
import { KENYA_COUNTIES, type KenyaCounty } from "../constants/locationData";
import { clearMetersCache } from "./meters";

interface CurrentUser {
  id: string;
  name?: string;
  email?: string;
}

export async function getAgentsList() {
  const startTime = Date.now();
  console.log("[getAgentsList] Starting query...");

  try {
    // Get agents with their meter counts using LEFT JOIN and GROUP BY
    // Wrapped with timeout to prevent hung queries
    console.log("[getAgentsList] Executing Drizzle query with LEFT JOIN...");
    const agentsData = await withTimeout(
      async () => {
        const queryStart = Date.now();
        console.log("[getAgentsList] Inside withTimeout, query starting...");
        const result = await db
          .select({
            id: agents.id,
            name: agents.name,
            phone_number: agents.phone_number,
            location: agents.location,
            county: agents.county,
            agent_type: agents.agent_type,
            is_active: agents.is_active,
            created_at: agents.created_at,
            total_meters: count(agentInventory.id),
          })
          .from(agents)
          .leftJoin(agentInventory, eq(agents.id, agentInventory.agent_id))
          .groupBy(
            agents.id,
            agents.name,
            agents.phone_number,
            agents.location,
            agents.county,
            agents.agent_type,
            agents.is_active,
            agents.created_at
          )
          .orderBy(desc(agents.created_at));
        console.log(
          `[getAgentsList] Query completed in ${Date.now() - queryStart}ms, got ${result.length} agents`
        );
        return result;
      },
      15000, // 15 second timeout (reduced)
      null // Return null to indicate timeout
    );

    if (agentsData === null) {
      console.error(
        `[getAgentsList] Query timed out after 15 seconds (total time: ${Date.now() - startTime}ms)`
      );
      return [];
    }

    console.log(
      `[getAgentsList] Success! Returning ${agentsData.length} agents (total time: ${Date.now() - startTime}ms)`
    );
    return agentsData;
  } catch (error) {
    console.error(
      `[getAgentsList] Error after ${Date.now() - startTime}ms:`,
      error
    );
    return [];
  }
}

export async function updateAgentStatus(agentId: string, isActive: boolean) {
  try {
    await db
      .update(agents)
      .set({ is_active: isActive })
      .where(eq(agents.id, agentId));

    return true;
  } catch (error) {
    console.error("Error updating agent status:", error);
    throw error;
  }
}

export async function updateAgentDetails(
  agentId: string,
  updates: {
    name?: string;
    phone_number?: string;
    location?: string;
    county?: KenyaCounty;
    agent_type?: "cash" | "credit";
  }
) {
  try {
    // Validate county if it's being updated
    if (updates.county && !KENYA_COUNTIES.includes(updates.county)) {
      throw new Error("Invalid county selected");
    }

    // Validate agent_type if it's being updated
    if (
      updates.agent_type &&
      !["cash", "credit"].includes(updates.agent_type)
    ) {
      throw new Error("Invalid agent type. Must be 'cash' or 'credit'");
    }

    const [updatedAgent] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, agentId))
      .returning();

    if (!updatedAgent) {
      throw new Error("Agent not found");
    }

    return updatedAgent;
  } catch (error: any) {
    if (error.code === "23505") {
      throw new Error("Phone number already registered to another agent");
    }
    console.error("Error updating agent details:", error);
    throw error;
  }
}

export async function createAgent(agentData: {
  name: string;
  phone_number: string;
  location: string;
  county: KenyaCounty;
  agent_type?: "cash" | "credit";
}) {
  try {
    // Validate county
    if (!KENYA_COUNTIES.includes(agentData.county)) {
      throw new Error("Invalid county selected");
    }

    // Validate agent_type if provided
    if (
      agentData.agent_type &&
      !["cash", "credit"].includes(agentData.agent_type)
    ) {
      throw new Error("Invalid agent type. Must be 'cash' or 'credit'");
    }

    const [data] = await db
      .insert(agents)
      .values({
        ...agentData,
        agent_type: agentData.agent_type || "cash",
        is_active: true,
      })
      .returning();

    return data;
  } catch (error: any) {
    if (error.code === "23505") {
      throw new Error("Phone number already registered");
    }
    console.error("Error creating agent:", error);
    throw error;
  }
}

export async function assignMetersToAgent({
  agentId,
  meters: meterList,
  assignedBy,
}: {
  agentId: string;
  meters: Array<{
    meter_id: string;
    serial_number: string;
    type: string;
  }>;
  assignedBy: string;
}) {
  if (!agentId?.trim()) {
    throw new Error("Agent ID is required");
  }

  if (meterList.length === 0) {
    throw new Error("No meters provided for assignment");
  }

  const meterIdSet = new Set<string>();
  const duplicateIds = new Set<string>();
  const serialSet = new Set<string>();
  const duplicateSerials = new Set<string>();

  for (const meter of meterList) {
    if (meterIdSet.has(meter.meter_id)) {
      duplicateIds.add(meter.meter_id);
    } else {
      meterIdSet.add(meter.meter_id);
    }

    const normalizedSerial = meter.serial_number.trim().toUpperCase();
    if (serialSet.has(normalizedSerial)) {
      duplicateSerials.add(normalizedSerial);
    } else {
      serialSet.add(normalizedSerial);
    }
  }

  if (duplicateIds.size > 0) {
    throw new Error(
      `Duplicate meter IDs detected: ${Array.from(duplicateIds).join(", ")}`
    );
  }

  if (duplicateSerials.size > 0) {
    throw new Error(
      `Duplicate serial numbers detected: ${Array.from(duplicateSerials).join(", ")}`
    );
  }

  try {
    const result = await db.transaction(async (tx) => {
      const meterIds = meterList.map((m) => m.meter_id);

      const availableMeters = await tx
        .select({
          id: meters.id,
          serial_number: meters.serial_number,
          type: meters.type,
        })
        .from(meters)
        .where(inArray(meters.id, meterIds));

      if (availableMeters.length !== meterList.length) {
        const foundIds = new Set(availableMeters.map((m) => m.id));
        const missingIds = meterIds.filter((id) => !foundIds.has(id));
        throw new Error(
          `Some meters are no longer available for assignment. Missing IDs: ${missingIds.join(", ")}`
        );
      }

      const inventoryPayload = availableMeters.map((meter) => ({
        agent_id: agentId,
        meter_id: meter.id,
        serial_number: meter.serial_number,
        type: meter.type,
      }));

      const insertedInventory = await tx
        .insert(agentInventory)
        .values(inventoryPayload)
        .returning();

      const typeCounts = new Map<string, number>();
      for (const meter of availableMeters) {
        typeCounts.set(meter.type, (typeCounts.get(meter.type) ?? 0) + 1);
      }

      const transactionsPayload = Array.from(typeCounts.entries()).map(
        ([type, quantity]) => ({
          agent_id: agentId,
          transaction_type: "assignment" as const,
          meter_type: type,
          quantity,
        })
      );

      if (transactionsPayload.length > 0) {
        await tx.insert(agentTransactions).values(transactionsPayload);
      }

      const removedMeters = await tx
        .delete(meters)
        .where(inArray(meters.id, meterIds))
        .returning({ id: meters.id });

      if (removedMeters.length !== meterList.length) {
        throw new Error(
          "Failed to remove all meters from stock during assignment"
        );
      }

      return insertedInventory;
    });

    await clearMetersCache();

    return result;
  } catch (error) {
    console.error("Error assigning meters to agent:", error);
    throw error;
  }
}

export async function getAgentInventory(agentId: string) {
  try {
    const data = await db
      .select()
      .from(agentInventory)
      .where(eq(agentInventory.agent_id, agentId))
      .orderBy(desc(agentInventory.assigned_at));

    return data;
  } catch (error) {
    console.error("Error fetching agent inventory:", error);
    throw error;
  }
}

export async function getAgentInventoryBySerial(
  serialNumber: string,
  agentId: string
) {
  try {
    const normalizedSerial = serialNumber.toUpperCase();

    const [data] = await db
      .select()
      .from(agentInventory)
      .where(
        and(
          eq(agentInventory.agent_id, agentId),
          ilike(agentInventory.serial_number, normalizedSerial)
        )
      )
      .limit(1);

    return data;
  } catch (error) {
    console.error("Error retrieving meter from agent inventory:", error);
    throw error;
  }
}

export async function returnMetersFromAgent({
  agentId,
  meters: meterList,
  returnedBy,
  returnerName,
}: {
  agentId: string;
  meters: Array<{
    meter_id: string;
    serial_number: string;
    type: string;
  }>;
  returnedBy: string;
  returnerName: string;
}) {
  try {
    await db.transaction(async (tx) => {
      const metersToRestore = meterList.map((meter) => ({
        serial_number: meter.serial_number,
        type: meter.type,
        added_by: returnedBy,
        adder_name: returnerName || "Unknown",
      }));

      if (metersToRestore.length > 0) {
        await tx.insert(meters).values(metersToRestore);
      }

      const serialNumbersToDelete = meterList.map((m) => m.serial_number);

      if (serialNumbersToDelete.length > 0) {
        await tx
          .delete(agentInventory)
          .where(
            and(
              eq(agentInventory.agent_id, agentId),
              inArray(agentInventory.serial_number, serialNumbersToDelete)
            )
          );
      }

      if (meterList.length > 0) {
        const transactionData = meterList.map((meter) => ({
          agent_id: agentId,
          transaction_type: "return" as const,
          meter_type: meter.type,
          quantity: 1,
        }));

        await tx.insert(agentTransactions).values(transactionData);
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error returning meters from agent:", error);
    throw error;
  }
}

export async function removeFromAgentInventory(meterId: string) {
  try {
    // First, verify the meter exists in agent inventory
    const [existing] = await db
      .select({ id: agentInventory.id })
      .from(agentInventory)
      .where(eq(agentInventory.id, meterId))
      .limit(1);

    if (!existing) {
      throw new Error(`Meter with ID ${meterId} not found in agent inventory`);
    }

    // Delete the meter from agent inventory
    const result = await db
      .delete(agentInventory)
      .where(eq(agentInventory.id, meterId))
      .returning();

    if (!result || result.length === 0) {
      throw new Error(`Failed to delete meter ${meterId} from agent inventory`);
    }

    return result[0];
  } catch (error) {
    console.error("Error removing from agent inventory:", error);
    throw error;
  }
}

export async function deleteAgent(
  agentId: string,
  currentUser: CurrentUser,
  scannedMeters: string[] = [],
  unscannedMeters: string[] = []
) {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(agentTransactions)
        .where(eq(agentTransactions.agent_id, agentId));

      const agentMeters = await tx
        .select()
        .from(agentInventory)
        .where(eq(agentInventory.agent_id, agentId));

      if (agentMeters.length > 0) {
        const metersToRestore = agentMeters
          .filter((meter) => scannedMeters.includes(meter.serial_number))
          .map((meter) => ({
            serial_number: meter.serial_number,
            type: meter.type,
            added_by: currentUser.id,
            adder_name: currentUser.name || currentUser.email || "Unknown",
          }));

        if (metersToRestore.length > 0) {
          await tx.insert(meters).values(metersToRestore);
        }

        await tx
          .delete(agentInventory)
          .where(eq(agentInventory.agent_id, agentId));
      }

      const [deletedAgent] = await tx
        .delete(agents)
        .where(eq(agents.id, agentId))
        .returning();

      if (!deletedAgent) {
        throw new Error("Failed to delete agent");
      }
    });

    return {
      restoredCount: scannedMeters.length,
      deletedCount: unscannedMeters.length,
    };
  } catch (error) {
    console.error("Error in deleteAgent:", error);
    throw error;
  }
}

export async function getAgentInventoryCount() {
  try {
    const data = await db
      .select({
        type: agentInventory.type,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(agentInventory)
      .groupBy(agentInventory.type);

    return data.map((item) => ({
      type: item.type,
      with_agents: Number(item.count),
    }));
  } catch (error) {
    console.error("Error fetching agent inventory count:", error);
    return [];
  }
}

// Get meter counts grouped by type for each agent (for export)
export async function getAgentsMeterCountsByType(): Promise<
  Record<string, Record<string, number>>
> {
  try {
    const data = await db
      .select({
        agent_id: agentInventory.agent_id,
        type: agentInventory.type,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(agentInventory)
      .groupBy(agentInventory.agent_id, agentInventory.type);

    // Transform into a nested object: { agentId: { type: count } }
    const result: Record<string, Record<string, number>> = {};
    for (const item of data) {
      if (!result[item.agent_id]) {
        result[item.agent_id] = {};
      }
      result[item.agent_id][item.type.toLowerCase()] = Number(item.count);
    }

    return result;
  } catch (error) {
    console.error("Error fetching agents meter counts by type:", error);
    return {};
  }
}

export async function getAgentTransactions(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  filters?: {
    transactionType?: string;
    meterType?: string;
    agentId?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  try {
    const offset = (page - 1) * limit;

    // Build the where conditions array
    const conditions = [];

    if (searchTerm) {
      conditions.push(ilike(agents.name, `%${searchTerm}%`));
    }

    if (filters?.transactionType) {
      const validTransactionTypes = ["assignment", "return"] as const;
      if (
        validTransactionTypes.includes(
          filters.transactionType as (typeof validTransactionTypes)[number]
        )
      ) {
        conditions.push(
          eq(
            agentTransactions.transaction_type,
            filters.transactionType as "assignment" | "return"
          )
        );
      }
    }

    if (filters?.meterType) {
      conditions.push(eq(agentTransactions.meter_type, filters.meterType));
    }

    if (filters?.agentId) {
      conditions.push(eq(agentTransactions.agent_id, filters.agentId));
    }

    if (filters?.startDate) {
      conditions.push(
        gte(agentTransactions.transaction_date, filters.startDate)
      );
    }

    if (filters?.endDate) {
      // Set end date to end of day
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(agentTransactions.transaction_date, endOfDay));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Use a subquery so we only aggregate once and leverage a window function for total rows.
    const aggregated = db
      .select({
        agent_id: agentTransactions.agent_id,
        agent_name: agents.name,
        transaction_type: agentTransactions.transaction_type,
        meter_type: agentTransactions.meter_type,
        transaction_date: agentTransactions.transaction_date,
        total_quantity: sql<number>`sum(${agentTransactions.quantity})`.as(
          "total_quantity"
        ),
        row_count: sql<number>`count(*) over ()`.as("row_count"),
      })
      .from(agentTransactions)
      .leftJoin(agents, eq(agentTransactions.agent_id, agents.id))
      .where(whereClause)
      .groupBy(
        agentTransactions.agent_id,
        agents.name,
        agentTransactions.transaction_type,
        agentTransactions.meter_type,
        agentTransactions.transaction_date
      )
      .as("aggregated_agent_transactions");

    const pagedResults = await db
      .select()
      .from(aggregated)
      .orderBy(desc(aggregated.transaction_date))
      .limit(limit)
      .offset(offset);

    const total = pagedResults[0]?.row_count ?? 0;

    return {
      transactions: pagedResults.map((t, index) => ({
        id: `${t.agent_id}-${new Date(t.transaction_date!).getTime()}-${t.transaction_type}-${t.meter_type}-${offset + index}`,
        agent_id: t.agent_id,
        agent_name: t.agent_name,
        transaction_type: t.transaction_type,
        meter_type: t.meter_type,
        quantity: Number(t.total_quantity),
        transaction_date: t.transaction_date,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: total ? Math.ceil(total / limit) : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching agent transactions:", error);
    return {
      transactions: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    };
  }
}

/**
 * Consolidated function to fetch all Agents page data in a single call
 * This reduces multiple POST requests to a single server-side fetch
 */
export async function getAgentsPageData() {
  try {
    const agentsList = await getAgentsList();

    return {
      agents: agentsList,
    };
  } catch (error) {
    console.error("Error fetching agents page data:", error);
    return {
      agents: [],
    };
  }
}

/**
 * Get agent sales analytics data for charting
 * Returns daily sales counts for each agent from their creation date
 */
export async function getAgentSalesAnalytics(
  agentIds?: string[],
  days: number = 30
) {
  try {
    // Get agents with their created_at dates
    const agentsQuery = agentIds?.length
      ? await db
          .select({
            id: agents.id,
            name: agents.name,
            created_at: agents.created_at,
          })
          .from(agents)
          .where(inArray(agents.id, agentIds))
      : await db
          .select({
            id: agents.id,
            name: agents.name,
            created_at: agents.created_at,
          })
          .from(agents)
          .where(eq(agents.is_active, true));

    if (agentsQuery.length === 0) {
      return { agents: [], salesData: [], topPerformer: null };
    }

    const agentNames = agentsQuery.map((a) => a.name);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Format dates as ISO strings for PostgreSQL
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Build the agent names array for SQL
    const escapedNames = agentNames
      .map((n) => `'${n.replaceAll("'", "''")}'`)
      .join(",");
    const agentArraySql = `ARRAY[${escapedNames}]`;

    // Get sales data grouped by date and agent (recipient)
    const salesData = await db.execute(sql`
      SELECT 
        DATE(sale_date) as date,
        recipient as agent_name,
        SUM(batch_amount) as total_meters
      FROM sale_batches
      WHERE customer_type = 'agent'
        AND recipient = ANY(${sql.raw(agentArraySql)})
        AND sale_date >= ${startDateStr}
        AND sale_date <= ${endDateStr}
      GROUP BY DATE(sale_date), recipient
      ORDER BY DATE(sale_date) ASC
    `);

    // Get total sales per agent for ranking
    const agentTotals = await db.execute(sql`
      SELECT 
        recipient as agent_name,
        SUM(batch_amount) as total_meters,
        COUNT(*) as total_transactions
      FROM sale_batches
      WHERE customer_type = 'agent'
        AND recipient = ANY(${sql.raw(agentArraySql)})
      GROUP BY recipient
      ORDER BY total_meters DESC
    `);

    const totalsArray = agentTotals as unknown as Array<{
      agent_name: string;
      total_meters: string;
      total_transactions: string;
    }>;

    const topPerformer = totalsArray.length > 0 ? totalsArray[0] : null;

    // Transform data for charting - create a map of date -> agent -> count
    const salesArray = salesData as unknown as Array<{
      date: string;
      agent_name: string;
      total_meters: string;
    }>;

    // Create date range with all dates
    const dateMap = new Map<string, Record<string, number>>();
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      dateMap.set(dateStr, {});
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in sales data
    for (const row of salesArray) {
      const dateStr =
        typeof row.date === "string"
          ? row.date.split("T")[0]
          : new Date(row.date).toISOString().split("T")[0];
      const agentData = dateMap.get(dateStr) || {};
      agentData[row.agent_name] = Number(row.total_meters);
      dateMap.set(dateStr, agentData);
    }

    // Convert to array format for recharts
    const chartData = Array.from(dateMap.entries()).map(([date, agents]) => ({
      date,
      ...agents,
    }));

    return {
      agents: agentsQuery.map((a) => ({
        id: a.id,
        name: a.name,
        createdAt: a.created_at,
        totalSales:
          Number(
            totalsArray.find((t) => t.agent_name === a.name)?.total_meters
          ) || 0,
      })),
      salesData: chartData,
      topPerformer: topPerformer
        ? {
            name: topPerformer.agent_name,
            totalMeters: Number(topPerformer.total_meters),
            totalTransactions: Number(topPerformer.total_transactions),
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching agent sales analytics:", error);
    return { agents: [], salesData: [], topPerformer: null };
  }
}
