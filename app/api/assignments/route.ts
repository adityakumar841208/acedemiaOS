import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Assignment } from "@/types";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AssignmentModel from "@/models/Assignment";
import { createAssignmentNotification } from "@/lib/services/notification.service";
import { getAssignmentConfig, getAssignmentType } from "@/lib/assignment-types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId") || undefined;
  
  let rawAssignments: any[] = [];
  try {
    await connectToDatabase();
    const query = subjectId ? { subjectId } : {};
    const dbAssignments = await AssignmentModel.find(query).sort({ deadline: 1 }).lean();
    if (dbAssignments && dbAssignments.length > 0) {
      rawAssignments = dbAssignments.map((assignment: any) => ({
        ...assignment,
        assignmentType: getAssignmentType(assignment.assignmentType),
        allowedFileTypes: assignment.allowedFileTypes || getAssignmentConfig(assignment.assignmentType).allowedFileTypes,
        maxFileSize: assignment.maxFileSize || 25 * 1024 * 1024,
        maxFiles: assignment.maxFiles ?? getAssignmentConfig(assignment.assignmentType).maxFiles,
        _id: undefined,
        deadline: assignment.deadline.toISOString(),
        createdAt: assignment.createdAt.toISOString(),
      }));
    } else {
      rawAssignments = store.getAssignments(subjectId).map((assignment) => ({
        ...assignment,
        assignmentType: getAssignmentType(assignment.assignmentType),
        allowedFileTypes: assignment.allowedFileTypes || getAssignmentConfig(assignment.assignmentType).allowedFileTypes,
        maxFileSize: assignment.maxFileSize || 25 * 1024 * 1024,
        maxFiles: assignment.maxFiles ?? getAssignmentConfig(assignment.assignmentType).maxFiles,
      }));
    }
  } catch (error) {
    console.error("Assignment database read failed; using local fallback.", error);
    rawAssignments = store.getAssignments(subjectId);
  }

  // Enrich with live submission & evaluation statistics
  const enrichedAssignments = rawAssignments.map((assign) => {
    const subs = store.getSubmissions(assign.id);
    const totalSubmissions = subs.length;
    const evaluatedCount = subs.filter((s) => s.status === "graded" && s.marks !== undefined).length;
    const pendingCount = totalSubmissions - evaluatedCount;
    const isPastDeadline = new Date(assign.deadline).getTime() < Date.now();
    const lateCount = subs.filter((s) => s.status === "late" || (s.submittedAt && new Date(s.submittedAt) > new Date(assign.deadline))).length;
    const totalScore = subs.filter((s) => s.status === "graded" && s.marks !== undefined).reduce((acc, s) => acc + (s.marks || 0), 0);
    const averageScore = evaluatedCount > 0 ? Math.round((totalScore / evaluatedCount) * 10) / 10 : 0;
    const progressPercentage = totalSubmissions > 0 ? Math.round((evaluatedCount / totalSubmissions) * 100) : 0;

    let evaluationStatus: "NO_SUBMISSIONS" | "PENDING_EVALUATION" | "FULLY_EVALUATED" = "NO_SUBMISSIONS";
    if (totalSubmissions === 0) {
      evaluationStatus = "NO_SUBMISSIONS";
    } else if (pendingCount > 0) {
      evaluationStatus = "PENDING_EVALUATION";
    } else {
      evaluationStatus = "FULLY_EVALUATED";
    }

    return {
      ...assign,
      totalSubmissions,
      pendingCount,
      evaluatedCount,
      lateCount,
      averageScore,
      progressPercentage,
      isPastDeadline,
      evaluationStatus,
    };
  });

  return NextResponse.json({ assignments: enrichedAssignments });
}

export async function POST(req: NextRequest) {
  try {
    const faculty = await requireRole(["FACULTY", "ADMIN"]);

    const body = await req.json();
    const {
      title,
      description,
      subjectId,
      moduleId,
      totalMarks = 20,
      deadline,
      allowLate = false,
      instructions = [],
      assignmentType = "code",
      maxFileSize = 25 * 1024 * 1024,
      maxFiles,
    } = body;

    if (!title || !subjectId || !deadline) {
      return NextResponse.json(
        { error: "Title, Subject, and Deadline are required fields." },
        { status: 400 }
      );
    }

    const subject = store.getSubjectById(subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    const modules = store.getModules(subject.id);
    const mod = modules.find((m) => m.id === moduleId) || modules[0] || {
      id: "mod-gen",
      title: "General Module",
    };

    const normalizedType = getAssignmentType(assignmentType);
    const typeConfig = getAssignmentConfig(normalizedType);
    const newAssignment: Assignment = {
      id: `assign-${Date.now()}`,
      title,
      description: description || `Course assignment for ${subject.name}`,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      moduleId: mod.id,
      moduleTitle: mod.title,
      departmentId: subject.departmentId,
      semesterNumber: subject.semesterNumber,
      facultyId: faculty.id,
      facultyName: faculty.name,
      totalMarks: Number(totalMarks),
      deadline: new Date(deadline).toISOString(),
      allowLate: Boolean(allowLate),
      instructions: instructions.length > 0 ? instructions : [
        "Read problem statement carefully before answering.",
        "Plagiarism detection is active. Do not share solution code.",
      ],
      assignmentType: normalizedType,
      allowedFileTypes: typeConfig.allowedFileTypes,
      maxFileSize: Math.min(Math.max(Number(maxFileSize) || 25 * 1024 * 1024, 1024), 100 * 1024 * 1024),
      maxFiles: Math.min(Math.max(Number(maxFiles ?? typeConfig.maxFiles), normalizedType === "text" ? 0 : 1), 10),
      createdAt: new Date().toISOString(),
    };

    await connectToDatabase();
    const saved = await AssignmentModel.create(newAssignment);
    await createAssignmentNotification(newAssignment);
    return NextResponse.json({ success: true, assignment: saved }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to create assignment" }, { status });
  }
}
