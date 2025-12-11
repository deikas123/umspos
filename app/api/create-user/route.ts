import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password, role, name } = await request.json();

  try {
    // Create user with Better Auth Admin API including custom fields
    const result = await auth.api.createUser({
      headers: request.headers,
      body: {
        email,
        password,
        name,
        data: {
          displayName: name,
          appRole: role,
          isActive: true,
        },
      },
    });

    if (!result?.user) throw new Error("Failed to create user");

    return NextResponse.json({ message: "User created successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
