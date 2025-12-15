import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  anonymousClient,
  phoneNumberClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { ac, admin, accountant, user } from "@/lib/auth/permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        admin,
        accountant,
        user,
      },
    }),
    anonymousClient(),
    phoneNumberClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        // Redirect to 2FA verification page
        globalThis.window.location.href = "/two-factor";
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
