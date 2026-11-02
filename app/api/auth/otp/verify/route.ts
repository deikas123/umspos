import { NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";
import { auth } from "@/auth";

const OTP_PREFIX = "otp:2fa:";

function extractUserIdFromTwoFactorCookie(cookieHeader: string): string | null {
  const match = cookieHeader.match(
    /__Secure-better-auth\.two_factor=([^;]+)|better-auth\.two_factor=([^;]+)/
  );
  if (!match) return null;

  const raw = decodeURIComponent(match[1] || match[2]);
  if (!raw.startsWith("2fa-")) return null;

  const withoutPrefix = raw.slice(4);
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

    // Try full session first
    const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
    if (session?.user) {
      userId = session.user.id;
    }

    // Fall back to 2FA pending cookie
    if (!userId) {
      const cookieHeader = request.headers.get("cookie") || "";
      userId = extractUserIdFromTwoFactorCookie(cookieHeader);
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const key = `${OTP_PREFIX}${userId}`;
    const storedOtp = await redis.get<string>(key);

    if (!storedOtp) {
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    if (storedOtp !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // OTP correct — delete so it can't be reused
    await redis.del(key);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
