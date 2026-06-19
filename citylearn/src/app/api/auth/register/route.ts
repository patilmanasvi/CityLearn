import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, normalizeEmail, toPublicUser } from "@/lib/users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name : "";

    if (!email.trim() || !password || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (findUserByEmail(email)) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const user = createUser({
      email: normalizeEmail(email),
      password,
      name,
      department: typeof body.department === "string" ? body.department : undefined,
      role: typeof body.role === "string" ? body.role : undefined,
      country: typeof body.country === "string" ? body.country : undefined,
      state: typeof body.state === "string" ? body.state : undefined,
      city: typeof body.city === "string" ? body.city : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: toPublicUser(user),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
