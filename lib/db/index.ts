import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// DATABASE_URL should be the pooler URL (port 6543 with pgbouncer=true)
const connectionString = process.env.DATABASE_URL!;

// Singleton pattern to prevent connection leaks during hot reloads
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

// For serverless (Vercel), use minimal connections with the pooler
const isProduction = process.env.NODE_ENV === "production";

const client =
  globalForDb.client ??
  postgres(connectionString, {
    prepare: false, // Required for pgbouncer transaction mode
    max: isProduction ? 2 : 3, // Reduce connections to avoid pool exhaustion
    idle_timeout: 10, // Close idle connections faster
    connect_timeout: 5, // Fail fast if can't connect in 5s
    max_lifetime: 60 * 10, // 10 minutes max lifetime
    connection: {
      statement_timeout: 15000, // 15s query timeout (reduced from 30s)
      idle_in_transaction_session_timeout: 10000, // 10s idle in transaction
    },
    debug: !isProduction, // Log queries in development
  });

if (!isProduction) {
  globalForDb.client = client;
}

export const db = drizzle(client);

export default db;
