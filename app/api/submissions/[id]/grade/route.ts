import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { store } from "@/lib/store";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AssignmentSubmission from "@/models/AssignmentSubmission";
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

    await connectToDatabase();

    // Find the existing submission in MongoDB (never create duplicate)
    let submission = await AssignmentSubmission.findOne({
      $or: [
        { id },
        ...(mongoose.isValidObjectId(id) ? [{ _id: new mongoose.Types.ObjectId(id) }] : []),
      ],
    });

    if (!submission) {
      // If not in DB yet (e.g. from legacy seed or store), check store
      const storeSub = store.getSubmissionById(id);
      if (storeSub) {
        submission = await AssignmentSubmission.create({
          id: storeSub.id,
          assignmentId: storeSub.assignmentId,
          studentId: storeSub.studentId,
          studentName: storeSub.studentName,
          studentRoll: storeSub.studentRoll,
          submittedAt: new Date(storeSub.submittedAt),
          content: storeSub.content,
          fileName: storeSub.fileName,
          fileSize: storeSub.fileSize,
          submissionType: storeSub.submissionType || "code",
          files: storeSub.files || [],
          status: "submitted",
          maxMarks: storeSub.maxMarks || 20,
          similarity: storeSub.similarity,
        });
      }
    }

    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    // UPDATE the existing submission record in MongoDB
    submission.marks = Number(marks);
    submission.feedback = feedback !== undefined ? String(feedback).trim() : "";
    submission.status = "graded";
    submission.gradedAt = new Date();
    submission.gradedBy = faculty.name;
    submission.evaluatedAt = new Date();
    submission.evaluatedBy = faculty.name;

    await submission.save();

    // Sync in-memory store
    try {
      store.gradeSubmission(submission.id, Number(marks), feedback || "", faculty.name);
    } catch {
      // DB is primary source of truth
    }

    // Send student feedback notification
    try {
      await createGradeNotification({
        userId: submission.studentId,
        marks: Number(marks),
        maxMarks: submission.maxMarks,
        feedback: feedback || "",
        assignmentId: submission.assignmentId,
      });
    } catch (notifErr) {
      console.error("Failed to dispatch grade notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Submission evaluated successfully.",
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        studentName: submission.studentName,
        studentRoll: submission.studentRoll,
        submittedAt: submission.submittedAt.toISOString(),
        content: submission.content,
        fileName: submission.fileName,
        fileSize: submission.fileSize,
        submissionType: submission.submissionType,
        files: submission.files,
        status: submission.status,
        marks: submission.marks,
        maxMarks: submission.maxMarks,
        feedback: submission.feedback,
        gradedAt: submission.gradedAt?.toISOString(),
        gradedBy: submission.gradedBy,
        evaluatedAt: submission.evaluatedAt?.toISOString(),
        evaluatedBy: submission.evaluatedBy,
        similarity: submission.similarity,
      },
    });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json({ error: err.message || "Grading failed" }, { status });
  }
}
