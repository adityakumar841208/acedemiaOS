import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { store } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AssignmentSubmission from "@/models/AssignmentSubmission";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const viewer = await requireAuth();
    const { id } = await params;

    await connectToDatabase();

    let submission: any = await AssignmentSubmission.findOne({
      $or: [
        { id },
        ...(mongoose.isValidObjectId(id) ? [{ _id: new mongoose.Types.ObjectId(id) }] : []),
      ],
    }).lean();

    if (!submission) {
      const storeSub = store.getSubmissionById(id);
      if (storeSub) {
        submission = storeSub;
      }
    }

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Role check: Students can only view their own submission
    const isFacultyOrAdmin = viewer.role === "FACULTY" || viewer.role === "ADMIN";
    if (!isFacultyOrAdmin && submission.studentId !== viewer.id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot view another student's submission." },
        { status: 403 }
      );
    }

    const formattedSubmission = {
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      studentName: submission.studentName,
      studentRoll: submission.studentRoll,
      submittedAt: submission.submittedAt instanceof Date ? submission.submittedAt.toISOString() : String(submission.submittedAt),
      content: submission.content,
      fileName: submission.fileName,
      fileSize: submission.fileSize,
      fileUrl: submission.fileUrl,
      submissionType: submission.submissionType,
      files: submission.files,
      status: submission.status,
      marks: submission.marks,
      maxMarks: submission.maxMarks,
      feedback: submission.feedback,
      gradedAt: submission.gradedAt instanceof Date ? submission.gradedAt.toISOString() : submission.gradedAt,
      gradedBy: submission.gradedBy,
      evaluatedAt: submission.evaluatedAt instanceof Date ? submission.evaluatedAt.toISOString() : submission.evaluatedAt || (submission.gradedAt instanceof Date ? submission.gradedAt.toISOString() : submission.gradedAt),
      evaluatedBy: submission.evaluatedBy || submission.gradedBy,
      similarity: submission.similarity,
    };

    return NextResponse.json({ submission: formattedSubmission });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch submission detail" },
      { status }
    );
  }
}
