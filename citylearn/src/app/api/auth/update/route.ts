import { NextRequest, NextResponse } from "next/server";
import { updateUser, toPublicUser } from "@/lib/users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    const updates = {
      name: typeof body.name === "string" ? body.name : undefined,
      department: typeof body.department === "string" ? body.department : undefined,
      role: typeof body.role === "string" ? body.role : undefined,
      country: typeof body.country === "string" ? body.country : undefined,
      state: typeof body.state === "string" ? body.state : undefined,
      city: typeof body.city === "string" ? body.city : undefined,
    };

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const updatedUser = updateUser(id, cleanUpdates);

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully.",
        user: toPublicUser(updatedUser),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
