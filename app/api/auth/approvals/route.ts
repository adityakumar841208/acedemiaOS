import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";

const ApprovalSchema = z.object({
  studentId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().max(500).optional(),
});

function scopeFilter(approver: { role: string; department: string; semester?: number }): Record<string, unknown> {
  if (approver.role === "ADMIN") return { role: "STUDENT", status: "PENDING" };
  return {
    role: "STUDENT",
    status: "PENDING",
    department: approver.department,
    ...(approver.role === "CR" && approver.semester ? { semester: approver.semester } : {}),
  };
}

export async function GET() {
  try {
    const approver = await requireRole(["ADMIN", "FACULTY", "CR"]);
    await connectToDatabase();
    const students = await User.find(scopeFilter(approver))
      .select("name email department semester rollNumber createdAt")
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to load approvals" }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const approver = await requireRole(["ADMIN", "FACULTY", "CR"]);
    const parsed = ApprovalSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid approval" }, { status: 400 });

    await connectToDatabase();
    const filter = { ...scopeFilter(approver), _id: parsed.data.studentId };
    const update = parsed.data.action === "APPROVE"
      ? { status: "ACTIVE", approvedBy: approver.id, approvedAt: new Date(), $unset: { rejectedBy: 1, rejectedAt: 1, rejectionReason: 1 } }
      : { status: "REJECTED", rejectedBy: approver.id, rejectedAt: new Date(), rejectionReason: parsed.data.rejectionReason || "Registration was not approved." };
    const student = await User.findOneAndUpdate(filter, update, { new: true }).select("name status");
    if (!student) return NextResponse.json({ error: "Student is outside your approval scope or no longer pending." }, { status: 403 });
    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Approval failed" }, { status: error.status || 500 });
  }
}