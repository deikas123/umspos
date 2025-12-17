import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// DATABASE_URL should be the pooler URL (port 6543 with pgbouncer=true)
const connectionString = process.env.DATABASE_URL!;

// Singleton pattern for development hot reloads
// In production serverless, each invocation gets its own connection
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

const isProduction = process.env.NODE_ENV === "production";

// Create postgres client with serverless-optimized settings
function createClient() {
  return postgres(connectionString, {
    prepare: false, // Required for pgbouncer transaction mode
    max: 1, // Single connection per serverless invocation
    idle_timeout: 0, // Disable idle timeout - let Supabase pooler manage
    connect_timeout: 10, // 10s to establish connection
    max_lifetime: 60 * 5, // 5 minutes max lifetime
    connection: {
      statement_timeout: 15000, // 15s query timeout
    },
    onnotice: () => {}, // Suppress notices
  });
}

// In development, reuse connection across hot reloads
// In production, each cold start gets a fresh connection
function getClient() {
  if (isProduction) {
    return createClient();
  }
  globalForDb.client ??= createClient();
  return globalForDb.client;
}

const client = getClient();

export const db = drizzle(client);

export default db;
