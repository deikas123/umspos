import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// Singleton pattern - reuse connection across requests
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

function createClient() {
  return postgres(connectionString, {
    prepare: false, // Required for Supabase Transaction Pooler (pgbouncer)
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 5,
    connection: {
      statement_timeout: 25000,
    },
    onnotice: () => {},
  });
}

function getClient() {
  globalForDb.client ??= createClient();
  return globalForDb.client;
}

const client = getClient();

export const db = drizzle(client);

export default db;
