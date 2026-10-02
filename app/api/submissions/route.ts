import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AssignmentSubmission from "@/models/AssignmentSubmission";

export async function GET(req: NextRequest) {
  try {
    const viewer = await requireAuth();
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId") || undefined;
    const studentIdParam = searchParams.get("studentId") || undefined;

    // Derive student identity securely: non-faculty/admin can ONLY query their own submissions
    const isFacultyOrAdmin = viewer.role === "FACULTY" || viewer.role === "ADMIN";
    const requestedStudentId = isFacultyOrAdmin ? studentIdParam : viewer.id;

    await connectToDatabase();

    const query: any = {};
    if (assignmentId) query.assignmentId = assignmentId;
    if (requestedStudentId) query.studentId = requestedStudentId;

    let dbSubmissions: any[] = [];
    try {
      dbSubmissions = await AssignmentSubmission.find(query)
        .sort({ submittedAt: -1 })
        .lean();
    } catch (err) {
      console.error("AssignmentSubmission query failed:", err);
    }

    // Fall back to store if DB has no records (e.g. initial mock state)
    if (dbSubmissions.length === 0) {
      const storeSubs = store.getSubmissions(assignmentId, requestedStudentId);
      if (storeSubs.length > 0) {
        dbSubmissions = storeSubs.map((s) => ({
          ...s,
          submittedAt: new Date(s.submittedAt),
          gradedAt: s.gradedAt ? new Date(s.gradedAt) : undefined,
          evaluatedAt: s.evaluatedAt ? new Date(s.evaluatedAt) : s.gradedAt ? new Date(s.gradedAt) : undefined,
        }));
      }
    }

    const submissions = dbSubmissions.map((s) => ({
      id: s.id,
      assignmentId: s.assignmentId,
      studentId: s.studentId,
      studentName: s.studentName,
      studentRoll: s.studentRoll,
      submittedAt: s.submittedAt instanceof Date ? s.submittedAt.toISOString() : String(s.submittedAt),
      content: s.content,
      fileName: s.fileName,
      fileSize: s.fileSize,
      fileUrl: s.fileUrl,
      submissionType: s.submissionType,
      files: s.files,
      status: s.status,
      marks: s.marks,
      maxMarks: s.maxMarks,
      feedback: s.feedback,
      gradedAt: s.gradedAt instanceof Date ? s.gradedAt.toISOString() : s.gradedAt,
      gradedBy: s.gradedBy,
      evaluatedAt: s.evaluatedAt instanceof Date ? s.evaluatedAt.toISOString() : s.evaluatedAt || (s.gradedAt instanceof Date ? s.gradedAt.toISOString() : s.gradedAt),
      evaluatedBy: s.evaluatedBy || s.gradedBy,
      similarity: s.similarity,
    }));

    return NextResponse.json({ submissions });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch submissions" },
      { status }
    );
  }
}
