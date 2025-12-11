import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate input
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    // Sign in with Better Auth
    const result = await auth.api.signInEmail({
      headers: request.headers,
      body: {
        email,
        password,
      },
    });

    if (!result?.user) {
      return NextResponse.json({ error: "Sign in failed" }, { status: 400 });
    }

    // Return success - let the client handle navigation
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Sign in failed" },
      { status: 400 }
    );
  }
}
