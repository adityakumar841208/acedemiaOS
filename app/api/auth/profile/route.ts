import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import {
  requireAuth,
  createSessionToken,
  COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
});

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await req.json();

    const validated = UpdateProfileSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Only update name. Do NOT allow updating role or email
    const updated = await User.findByIdAndUpdate(
      currentUser.id,
      { name: validated.data.name },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const safeUser = {
      id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      role: updated.role,
      status: updated.status,
      department: updated.department,
      semester: updated.semester,
      rollNumber: updated.rollNumber,
    };

    // Refresh session token with updated name
    const token = await createSessionToken(safeUser);
    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: safeUser,
    });

    response.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update profile" },
      { status: err.status || 500 }
    );
  }
}

