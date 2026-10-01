import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AIPracticeQuiz from "@/models/AIPracticeQuiz";

export async function GET() {
  try {
    const student = await requireRole("STUDENT");
    await connectToDatabase();
    const history = await AIPracticeQuiz.find({ studentId: student.id, submittedAt: { $exists: true } }).select("topic difficulty score submittedAt createdAt").sort({ submittedAt: -1 }).limit(20).lean();
    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to load practice history." }, { status: error.status || 500 });
  }
}
