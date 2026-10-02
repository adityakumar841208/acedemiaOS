import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import { getAssignmentConfig, getAssignmentType, validateFileSignature } from "@/lib/assignment-types";
import { analyzeSimilarity } from "@/lib/services/similarity.service";
import { canSubmitAssignment } from "@/lib/permissions";

interface SubmissionFile {
  originalName: string;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    // Verify role permissions: only students and CRs can submit assignments
    if (!canSubmitAssignment(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only students can submit assignments." },
        { status: 403 }
      );
    }

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
      files = await Promise.all(
        uploadedFiles.map(async (file) => ({
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          bytes: new Uint8Array(await file.arrayBuffer()),
        }))
      );
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

    await connectToDatabase();

    // 1. Fetch assignment from DB
    let assignment = await Assignment.findOne({ id }).lean();
    if (!assignment) {
      const storeAssign = store.getAssignmentById(id);
      if (storeAssign) {
        assignment = storeAssign as any;
      }
    }

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const assignmentType = getAssignmentType(assignment.assignmentType);
    const config = getAssignmentConfig(assignmentType);
    if (assignmentType === "text" && !content.trim()) {
      return NextResponse.json({ error: "This assignment requires a written answer." }, { status: 400 });
    }
    if (assignmentType !== "text" && files.length === 0 && assignmentType !== "code") {
      return NextResponse.json({ error: `This assignment only accepts ${config.label} files.` }, { status: 400 });
    }
    if (files.length > (assignment.maxFiles ?? config.maxFiles)) {
      return NextResponse.json(
        { error: `You can upload at most ${assignment.maxFiles ?? config.maxFiles} file(s).` },
        { status: 400 }
      );
    }
    for (const file of files) {
      if (file.size > (assignment.maxFileSize ?? 25 * 1024 * 1024)) {
        return NextResponse.json(
          { error: `${file.originalName} is larger than the assignment file-size limit.` },
          { status: 400 }
        );
      }
      if (!validateFileSignature({ name: file.originalName, type: file.mimeType, bytes: file.bytes }, assignmentType)) {
        return NextResponse.json(
          { error: `This assignment only accepts ${config.label} files with a valid file signature.` },
          { status: 400 }
        );
      }
    }

    // 2. Strict Server-side Deadline Enforcement
    const now = Date.now();
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

    // 3. Derive student identity strictly from the authenticated session
    const studentId = user.id;
    const studentName = user.name;
    const studentRoll = user.rollNumber || "CS22B" + user.id.slice(-4);

    // 4. Application-level check: Prevent multiple submissions
    const existingSubmission = await AssignmentSubmission.findOne({
      assignmentId: assignment.id,
      studentId,
    });
    if (existingSubmission) {
      return NextResponse.json(
        { error: "You have already submitted this assignment." },
        { status: 409 }
      );
    }

    // 5. Plagiarism / Similarity detection against existing submissions in MongoDB
    const existingSubmissions = await AssignmentSubmission.find({
      assignmentId: assignment.id,
    }).lean();

    const formattedExisting = existingSubmissions.map((s: any) => ({
      id: s.id,
      studentName: s.studentName,
      content: s.content || "",
      assignmentId: s.assignmentId,
      studentId: s.studentId,
      studentRoll: s.studentRoll,
      submittedAt: s.submittedAt ? s.submittedAt.toISOString() : new Date().toISOString(),
      status: s.status,
      maxMarks: s.maxMarks,
    }));

    const similarity = analyzeSimilarity(content, formattedExisting as any);

    // 6. Database persistence with MongoDB Compound Unique Index protection
    const submissionId = `subm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const submissionStatus = now > deadlineTime ? "late" : "submitted";

    try {
      const createdSubmission = await AssignmentSubmission.create({
        id: submissionId,
        assignmentId: assignment.id,
        studentId,
        studentName,
        studentRoll,
        submittedAt: new Date(),
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
        status: submissionStatus,
        maxMarks: assignment.totalMarks,
        similarity,
      });

      if (!createdSubmission) {
        return NextResponse.json(
          { error: "Database failed to persist submission." },
          { status: 500 }
        );
      }

      // Sync with in-memory store if needed for legacy notifications
      try {
        store.addSubmission({
          assignmentId: assignment.id,
          studentId,
          studentName,
          studentRoll,
          submittedAt: createdSubmission.submittedAt.toISOString(),
          content,
          fileName: createdSubmission.fileName,
          fileSize: createdSubmission.fileSize,
          submissionType: assignmentType,
          files: createdSubmission.files,
          status: submissionStatus,
          maxMarks: assignment.totalMarks,
          similarity,
        });
      } catch {
        // DB is the primary source of truth
      }

      const responseSubmission = {
        id: createdSubmission.id,
        assignmentId: createdSubmission.assignmentId,
        studentId: createdSubmission.studentId,
        studentName: createdSubmission.studentName,
        studentRoll: createdSubmission.studentRoll,
        submittedAt: createdSubmission.submittedAt.toISOString(),
        content: createdSubmission.content,
        fileName: createdSubmission.fileName,
        fileSize: createdSubmission.fileSize,
        submissionType: createdSubmission.submissionType,
        files: createdSubmission.files,
        status: createdSubmission.status,
        maxMarks: createdSubmission.maxMarks,
        similarity: createdSubmission.similarity,
      };

      return NextResponse.json(
        {
          success: true,
          message: "Assignment submitted successfully!",
          submission: responseSubmission,
        },
        { status: 201 }
      );
    } catch (dbErr: any) {
      // MongoDB duplicate key error code 11000
      if (dbErr.code === 11000 || dbErr.message?.includes("E11000")) {
        return NextResponse.json(
          { error: "You have already submitted this assignment." },
          { status: 409 }
        );
      }
      console.error("Database submission error:", dbErr);
      return NextResponse.json(
        { error: "Failed to persist assignment submission" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to process assignment submission" },
      { status }
    );
  }
}
