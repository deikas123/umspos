import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// DATABASE_URL should be the Supabase pooler URL
const connectionString = process.env.DATABASE_URL!;

// Singleton pattern - reuse connection across requests in the same function instance
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

// Create postgres client - shared across all requests in this function instance
function createClient() {
  console.log("[DB] Creating new postgres client...");
  return postgres(connectionString, {
    prepare: false, // Required for pgbouncer/supavisor
    max: 5, // Allow multiple concurrent queries
    idle_timeout: 20, // Close idle connections after 20s
    connect_timeout: 10, // 10s to establish connection
    max_lifetime: 60 * 5, // 5 minutes max lifetime
    connection: {
      statement_timeout: 25000, // 25s query timeout at DB level
    },
    onnotice: () => {}, // Suppress notices
    debug: (connection, query, params) => {
      console.log(`[DB Query] ${query.substring(0, 100)}...`);
    },
  });
}

// Always reuse the client within the same function instance
// This prevents creating new connections for every query
function getClient() {
  globalForDb.client ??= createClient();
  return globalForDb.client;
}

const client = getClient();

export const db = drizzle(client);

export default db;
