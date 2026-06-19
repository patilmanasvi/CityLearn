import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        address: user.address || "",
        department: user.department || "",
        role: user.role || "",
        country: user.country || "",
        state: user.state || "",
        city: user.city || "",
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, address, department, role, country, state, city } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Name and email are required fields." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is taken by another user
    const emailOwner = await User.findOne({ email: normalizedEmail });
    if (emailOwner && emailOwner._id.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: name.trim(),
          email: normalizedEmail,
          address: address || "",
          department: department || "",
          role: role || "",
          country: country || "",
          state: state || "",
          city: city || "",
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address || "",
        department: updatedUser.department || "",
        role: updatedUser.role || "",
        country: updatedUser.country || "",
        state: updatedUser.state || "",
        city: updatedUser.city || "",
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Clear session cookie
    cookieStore.delete("userId");

    return NextResponse.json({
      success: true,
      message: "Profile permanently deleted.",
    });
  } catch (error) {
    console.error("Delete profile error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
