import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { admin, anonymous, phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import {
  ac,
  admin as adminRole,
  accountant as accountantRole,
  user as userRole,
} from "@/lib/auth/permissions";

// DATABASE_URL should be the pooler URL (port 6543 with pgbouncer=true)
const connectionString = process.env.DATABASE_URL;

// Singleton pattern - always reuse pool
const globalForDb = globalThis as unknown as {
  authPool: Pool | undefined;
};

// Create pool with settings compatible with Supabase Transaction Pooler
function createAuthPool() {
  return new Pool({
    connectionString,
    max: 3, // Allow a few connections for auth
    idleTimeoutMillis: 30000, // 30s idle timeout
    connectionTimeoutMillis: 10000, // 10s to connect
    statement_timeout: 15000, // 15s query timeout
  });
}

// Always reuse the pool - critical for serverless
function getAuthPool() {
  globalForDb.authPool ??= createAuthPool();
  return globalForDb.authPool;
}

const authPool = getAuthPool();

export const auth = betterAuth({
  database: authPool,
  appName: "UMS POS",
  trustedOrigins: [
    "https://pos.umskenya.com",
    "https://operations.umskenya.com",
    "https://umsoperations.netlify.app",
    "https://alphaums.vercel.app",
    "https://umspos.netlify.app",
    "http://localhost:3000",
  ],
  emailAndPassword: {
    enabled: true,
    // Use bcrypt for password hashing (Supabase uses bcrypt)
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  plugins: [
    admin({
      ac,
      roles: {
        admin: adminRole,
        accountant: accountantRole,
        user: userRole,
      },
    }),
    anonymous(),
    phoneNumber(),
    nextCookies(),
  ],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  user: {
    additionalFields: {
      displayName: {
        type: "string",
        required: false,
        input: true,
      },
      appRole: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: true,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: true,
      },
      userMetadata: {
        type: "json",
        required: false,
        input: false,
      },
      appMetadata: {
        type: "json",
        required: false,
        input: false,
      },
      invitedAt: {
        type: "date",
        required: false,
        input: false,
      },
      lastSignInAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
});
