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
    prepare: false,
    max: isProduction ? 3 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
    connection: {
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 30000,
    },
  });

if (!isProduction) {
  globalForDb.client = client;
}

export const db = drizzle(client);

export default db;
