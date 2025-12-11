import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { admin, anonymous, phoneNumber, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import {
  ac,
  admin as adminRole,
  accountant as accountantRole,
  user as userRole,
} from "@/lib/auth/permissions";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
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
    twoFactor(),
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
