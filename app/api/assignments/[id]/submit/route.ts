import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Assignment from "@/models/Assignment";
import { getAssignmentConfig, getAssignmentType, validateFileSignature } from "@/lib/assignment-types";
import { Submission } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";
    let content = "";
    let fileName = "";
    let fileSize = "";
    let files: SubmissionFile[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      content = String(formData.get("content") || "");
      const uploadedFiles = formData.getAll("files").filter((item): item is File => item instanceof File);
      files = await Promise.all(uploadedFiles.map(async (file) => ({
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        bytes: new Uint8Array(await file.arrayBuffer()),
      })));
      fileName = files[0]?.originalName || "";
      fileSize = files[0] ? `${Math.round(files[0].size / 1024)} KB` : "";
    } else {
      const body = await req.json();
      content = body.content || "";
      fileName = body.fileName || "";
      fileSize = body.fileSize || "";
    }

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

    const resolvedAssignment = assignment;
    const assignmentType = getAssignmentType(resolvedAssignment.assignmentType);
    const config = getAssignmentConfig(assignmentType);
    if (assignmentType === "text" && !content.trim()) {
      return NextResponse.json({ error: "This assignment requires a written answer." }, { status: 400 });
    }
    if (assignmentType !== "text" && files.length === 0 && assignmentType !== "code") {
      return NextResponse.json({ error: `This assignment only accepts ${config.label} files.` }, { status: 400 });
    }
    if (files.length > (resolvedAssignment.maxFiles ?? config.maxFiles)) {
      return NextResponse.json({ error: `You can upload at most ${resolvedAssignment.maxFiles ?? config.maxFiles} file(s).` }, { status: 400 });
    }
    for (const file of files) {
      if (file.size > (resolvedAssignment.maxFileSize ?? 25 * 1024 * 1024)) {
        return NextResponse.json({ error: `${file.originalName} is larger than the assignment file-size limit.` }, { status: 400 });
      }
      if (!validateFileSignature({ name: file.originalName, type: file.mimeType, bytes: file.bytes }, assignmentType)) {
        return NextResponse.json({ error: `This assignment only accepts ${config.label} files with a valid file signature.` }, { status: 400 });
      }
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
      submissionType: assignmentType,
      files: files.map((file) => ({
        url: `data:${file.mimeType};base64,${Buffer.from(file.bytes).toString("base64")}`,
        originalName: file.originalName.replace(/[^a-zA-Z0-9._-]/g, "_"),
        mimeType: file.mimeType,
        size: file.size,
      })),
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

interface SubmissionFile {
  originalName: string;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}
