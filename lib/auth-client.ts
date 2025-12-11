import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  anonymousClient,
  phoneNumberClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    anonymousClient(),
    phoneNumberClient(),
    twoFactorClient(),
  ],
});

// Export commonly used functions for easier imports
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
