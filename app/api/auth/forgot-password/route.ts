import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import User from "@/models/User";

const RequestSchema = z.object({ email: z.string().email("Enter a valid email address") });

export async function POST(req: NextRequest) {
  try {
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    await connectToDatabase();
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (user) {
      const token = randomBytes(32).toString("hex");
      user.passwordResetTokenHash = createHash("sha256").update(token).digest("hex");
      user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendPasswordResetEmail(user.email, `${appUrl}/reset-password?token=${token}`);
    }

    return NextResponse.json({ success: true, message: "If an account exists for that email, a reset link has been sent." });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return NextResponse.json({ error: "Unable to send the reset email right now. Please try again later." }, { status: 500 });
  }
}