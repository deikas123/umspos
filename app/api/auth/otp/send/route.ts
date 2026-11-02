import { NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";
import { send2FAOTP } from "@/lib/services/smsService";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

const OTP_TTL = 300; // 5 minutes
const OTP_PREFIX = "otp:2fa:";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Extract userId from better-auth's two_factor pending cookie.
 * Cookie value format: "2fa-{userId}.{hmac-signature}"
 */
function extractUserIdFromTwoFactorCookie(cookieHeader: string): string | null {
  const match = cookieHeader.match(
    /__Secure-better-auth\.two_factor=([^;]+)|better-auth\.two_factor=([^;]+)/
  );
  if (!match) return null;

  const raw = decodeURIComponent(match[1] || match[2]);
  // Format: 2fa-{userId}.{signature}
  if (!raw.startsWith("2fa-")) return null;

  const withoutPrefix = raw.slice(4); // remove "2fa-"
  const dotIndex = withoutPrefix.indexOf(".");
  if (dotIndex === -1) return null;

  return withoutPrefix.slice(0, dotIndex);
}

export async function POST(request: Request) {
  try {
    if (!redis) {
      return NextResponse.json({ error: "OTP service unavailable" }, { status: 503 });
    }

    let userId: string | null = null;
    let phoneNumber: string | null = null;

    // First try a full session (for resend after verify)
    const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
    if (session?.user) {
      userId = session.user.id;
      phoneNumber = (session.user as any).phoneNumber || null;
    }

    // If no full session, extract from the 2FA pending cookie
    if (!userId) {
      const cookieHeader = request.headers.get("cookie") || "";
      userId = extractUserIdFromTwoFactorCookie(cookieHeader);

      if (userId) {
        const userRecord = await db
          .select({ phoneNumber: users.phoneNumber })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        phoneNumber = userRecord[0]?.phoneNumber || null;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: "No phone number on account" }, { status: 400 });
    }

    const otp = generateOTP();
    await redis.set(`${OTP_PREFIX}${userId}`, otp, { ex: OTP_TTL });

    const result = await send2FAOTP(phoneNumber, otp);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send OTP" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
  }
}
