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
import { send2FAOTP } from "@/lib/services/smsService";

// DATABASE_URL should be the pooler URL (port 6543 with pgbouncer=true)
const connectionString = process.env.DATABASE_URL;

// Singleton pattern for development hot reloads
const globalForDb = globalThis as unknown as {
  authPool: Pool | undefined;
};

const isProduction = process.env.NODE_ENV === "production";

// Create pool with serverless-optimized settings
function createAuthPool() {
  return new Pool({
    connectionString,
    max: 1, // Single connection for auth
    idleTimeoutMillis: 0, // Disable - let Supabase manage
    connectionTimeoutMillis: 10000, // 10s to connect
    statement_timeout: 10000, // 10s query timeout
  });
}

// In development, reuse pool across hot reloads
// In production, each cold start gets fresh pool
function getAuthPool() {
  if (isProduction) {
    return createAuthPool();
  }
  globalForDb.authPool ??= createAuthPool();
  return globalForDb.authPool;
}

const authPool = getAuthPool();

export const auth = betterAuth({
  database: authPool,
  appName: "UMS POS",
  trustedOrigins: [
    "https://pos.umskenya.com",
    "https://alphaums.vercel.app",
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
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }) {
          // Send OTP via SMS to user's phone number
          const userWithPhone = user as typeof user & { phoneNumber?: string };
          if (userWithPhone.phoneNumber) {
            const result = await send2FAOTP(userWithPhone.phoneNumber, otp);
            if (!result.success) {
              console.error("Failed to send 2FA OTP:", result.error);
              throw new Error("Failed to send verification code");
            }
          } else {
            console.error("User has no phone number configured for 2FA");
            throw new Error("No phone number configured for 2FA");
          }
        },
        period: 300, // 5 minutes expiration
      },
      skipVerificationOnEnable: false,
    }),
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
