import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import {
  verifyPassword,
  createSessionToken,
  COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/permissions";

const LoginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = LoginSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, password } = validated.data;

    await connectToDatabase();

    // Query user and explicitly include passwordHash (which is hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Verify password with bcryptjs
    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        {
          error: "Invalid password. Please check your credentials and try again.",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    const accountStatus = user.status || "ACTIVE";
    if (accountStatus === "PENDING") {
      return NextResponse.json({ error: "Your account is awaiting approval.", code: "PENDING" }, { status: 403 });
    }
    if (accountStatus === "REJECTED") {
      return NextResponse.json({ error: "Your registration was rejected. Please contact your administrator.", code: "REJECTED" }, { status: 403 });
    }
    if (accountStatus === "SUSPENDED") {
      return NextResponse.json({ error: "Your account has been suspended. Please contact your administrator.", code: "SUSPENDED" }, { status: 403 });
    }

    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: accountStatus,
      department: user.department,
      semester: user.semester,
      rollNumber: user.rollNumber,
    };

    // Create session JWT token
    const token = await createSessionToken(safeUser);

    // Determine destination route based strictly on the user's real role from the database
    const redirectTo = getRoleDashboardPath(user.role);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: safeUser,
      redirectTo,
    });

    // Set HTTP-only secure cookie
    response.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}

