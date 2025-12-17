"use server";

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

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

  // Check 2: Count a small table (users)
  try {
    const countStart = Date.now();
    const countResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM "user" LIMIT 1`
    );
    const countDuration = Date.now() - countStart;
    results.checks = {
      ...(results.checks as object),
      user_count: {
        status: "ok",
        duration_ms: countDuration,
        count: (countResult as unknown as Array<{ count: number }>)[0]?.count,
      },
    };
  } catch (error) {
    results.checks = {
      ...(results.checks as object),
      user_count: {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }

  // Check 3: Environment info
  results.environment = {
    node_env: process.env.NODE_ENV,
    has_database_url: !!process.env.DATABASE_URL,
    database_url_has_pgbouncer:
      process.env.DATABASE_URL?.includes("pgbouncer=true"),
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
