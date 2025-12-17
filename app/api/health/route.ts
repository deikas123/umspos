import { NextResponse } from "next/server";
import { sql, desc, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents, agentInventory } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const startTime = Date.now();
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check 1: Simple database ping
  try {
    const pingStart = Date.now();
    await db.execute(sql`SELECT 1 as ping`);
    const pingDuration = Date.now() - pingStart;
    results.checks = {
      ...(results.checks as object),
      database_ping: {
        status: "ok",
        duration_ms: pingDuration,
      },
    };
  } catch (error) {
    results.checks = {
      ...(results.checks as object),
      database_ping: {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        duration_ms: Date.now() - startTime,
      },
    };
  }

  // Check 2: Count a small table (users) - raw SQL
  try {
    const countStart = Date.now();
    const countResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM "user" LIMIT 1`
    );
    const countDuration = Date.now() - countStart;
    results.checks = {
      ...(results.checks as object),
      user_count_raw: {
        status: "ok",
        duration_ms: countDuration,
        count: (countResult as unknown as Array<{ count: number }>)[0]?.count,
      },
    };
  } catch (error) {
    results.checks = {
      ...(results.checks as object),
      user_count_raw: {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }

  // Check 3: Drizzle query builder with LEFT JOIN (mimics getAgentsList)
  try {
    const drizzleStart = Date.now();
    const agentsData = await db
      .select({
        id: agents.id,
        name: agents.name,
        total_meters: count(agentInventory.id),
      })
      .from(agents)
      .leftJoin(agentInventory, eq(agents.id, agentInventory.agent_id))
      .groupBy(agents.id, agents.name)
      .orderBy(desc(agents.created_at))
      .limit(5);
    const drizzleDuration = Date.now() - drizzleStart;
    results.checks = {
      ...(results.checks as object),
      drizzle_join_query: {
        status: "ok",
        duration_ms: drizzleDuration,
        count: agentsData.length,
      },
    };
  } catch (error) {
    results.checks = {
      ...(results.checks as object),
      drizzle_join_query: {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        duration_ms: Date.now() - startTime,
      },
    };
  }

  // Check 4: Environment info
  results.environment = {
    node_env: process.env.NODE_ENV,
    has_database_url: !!process.env.DATABASE_URL,
    database_url_has_pgbouncer:
      process.env.DATABASE_URL?.includes("pgbouncer=true"),
    database_url_port:
      process.env.DATABASE_URL?.match(/:(\d+)\//)?.[1] || "unknown",
    has_redis: !!process.env.UPSTASH_REDIS_REST_URL,
  };

  results.total_duration_ms = Date.now() - startTime;

  const allChecksOk = Object.values(results.checks as object).every(
    (check: unknown) => (check as { status: string }).status === "ok"
  );

  return NextResponse.json(results, {
    status: allChecksOk ? 200 : 503,
  });
}
