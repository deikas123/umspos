import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redis } from "@/lib/cache/redis";

const OTP_PREFIX = "otp:2fa:";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json(
        { error: "OTP service unavailable" },
        { status: 503 }
      );
    }

    const key = `${OTP_PREFIX}${session.user.id}`;
    const storedOtp = await redis.get<string>(key);

    if (!storedOtp) {
      return NextResponse.json(
        { error: "Code expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (storedOtp !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // OTP correct — delete so it can't be reused
    await redis.del(key);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
