import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import {
  hashPassword,
} from "@/lib/auth";

const RegisterSchema = z
  .object({
    name: z.string().min(2, "Full Name must be at least 2 characters").max(80),
    email: z.string().email("Please provide a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.unknown().optional(),
    department: z.string().min(2, "Department is required").default("CSE"),
    semester: z.coerce.number().min(1).max(8).optional().default(3),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RegisterSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      name,
      email,
      password,
      department,
      semester,
    } = validated.data;

    await connectToDatabase();

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const departmentCode = department.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "PORTAL";
    let departmentSequence = await User.countDocuments({ department: department.trim().toUpperCase() }) + 1;
    let portalRollNumber = `${departmentCode}${departmentSequence}`;
    while (await User.exists({ rollNumber: portalRollNumber })) {
      departmentSequence += 1;
      portalRollNumber = `${departmentCode}${departmentSequence}`;
    }

    // Create user in MongoDB
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "STUDENT",
      status: "PENDING",
      department,
      semester,
      rollNumber: portalRollNumber,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration submitted successfully.",
      },
      { status: 201 }
    );

    return response;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}

