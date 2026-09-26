import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireRole } from "@/lib/auth";
import { createGradeNotification } from "@/lib/services/notification.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const faculty = await requireRole(["FACULTY", "ADMIN"]);

    const { id } = await params;
    const body = await req.json();
    const { marks, feedback } = body;

    if (marks === undefined || marks === null) {
      return NextResponse.json({ error: "Marks are required." }, { status: 400 });
    }

    const updated = store.gradeSubmission(id, Number(marks), feedback || "", faculty.name);

    await createGradeNotification({
      userId: updated.studentId,
      marks: Number(marks),
      maxMarks: updated.maxMarks,
      feedback: feedback || "",
      assignmentId: updated.assignmentId,
    });

    return NextResponse.json({
      success: true,
      message: "Submission evaluated successfully.",
      submission: updated,
    });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json({ error: err.message || "Grading failed" }, { status });
  }
}
