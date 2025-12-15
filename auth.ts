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

// Singleton pattern to prevent connection leaks during hot reloads
const globalForDb = globalThis as unknown as {
  authPool: Pool | undefined;
};

const authPool =
  globalForDb.authPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });

globalForDb.authPool = authPool;

export const auth = betterAuth({
  database: authPool,
  appName: "UMS POS",
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
