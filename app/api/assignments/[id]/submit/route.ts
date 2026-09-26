import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Assignment from "@/models/Assignment";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    const { id } = await params;
    const body = await req.json();
    const { content, fileName, fileSize = "3.2 KB" } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Submission content or code solution cannot be empty." },
        { status: 400 }
      );
    }

    let assignment = store.getAssignmentById(id);
    if (!assignment) {
      await connectToDatabase();
      const databaseAssignment = await Assignment.findOne({ id }).lean();
      if (databaseAssignment) {
        const normalizedAssignment = {
          ...databaseAssignment,
          deadline: databaseAssignment.deadline.toISOString(),
          createdAt: databaseAssignment.createdAt.toISOString(),
        } as any;
        assignment = normalizedAssignment;
        store.ensureAssignment(normalizedAssignment);
      }
    }
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    // STRICT SERVER-SIDE DEADLINE ENFORCEMENT
    const now = new Date().getTime();
    const deadlineTime = new Date(assignment.deadline).getTime();
    if (now > deadlineTime && !assignment.allowLate) {
      return NextResponse.json(
        {
          error: "SUBMISSION REJECTED: The deadline has passed. Submissions are locked by academic policy.",
          deadline: assignment.deadline,
          currentTime: new Date().toISOString(),
          isLocked: true,
        },
        { status: 403 }
      );
    }

    // Derive student identity strictly from the authenticated session
    const studentId = user.id;
    const studentName = user.name;
    const studentRoll = user.rollNumber || "CS22B" + user.id.slice(-4);

    // Execute submission through store (which runs similarity check against other students)
    const submission = store.addSubmission({
      assignmentId: assignment.id,
      studentId,
      studentName,
      studentRoll,
      submittedAt: new Date().toISOString(),
      content,
      fileName: fileName || `${studentName.split(" ")[0]}_Solution.cpp`,
      fileSize,
      status: now > deadlineTime ? "late" : "submitted",
      maxMarks: assignment.totalMarks,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Assignment submitted successfully!",
        submission,
      },
      { status: 201 }
    );
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to process assignment submission" },
      { status }
    );
  }
}
