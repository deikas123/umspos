import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redis } from "@/lib/cache/redis";
import { send2FAOTP } from "@/lib/services/smsService";
import { headers } from "next/headers";

const OTP_TTL = 300; // 5 minutes
const OTP_PREFIX = "otp:2fa:";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    // Get session - user must be signed in
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const phoneNumber = user.phoneNumber;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "No phone number on account" },
        { status: 400 }
      );
    }

    if (!redis) {
      return NextResponse.json(
        { error: "OTP service unavailable" },
        { status: 503 }
      );
    }

    // Generate and store OTP
    const otp = generateOTP();
    const key = `${OTP_PREFIX}${session.user.id}`;
    await redis.set(key, otp, { ex: OTP_TTL });

    // Send via SMS
    const result = await send2FAOTP(phoneNumber, otp);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
