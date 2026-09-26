import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import User from "@/models/User";

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = ResetSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    await connectToDatabase();
    const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });

    user.passwordHash = await hashPassword(parsed.data.password);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json({ error: "Unable to reset your password right now." }, { status: 500 });
  }
}