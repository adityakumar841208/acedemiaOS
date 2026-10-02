import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Assignment } from "@/types";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AssignmentModel from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import { createAssignmentNotification } from "@/lib/services/notification.service";
import { getAssignmentConfig, getAssignmentType } from "@/lib/assignment-types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId") || undefined;
  const departmentId = searchParams.get("departmentId") || undefined;
  const semesterNumber = searchParams.get("semesterNumber")
    ? Number(searchParams.get("semesterNumber"))
    : undefined;
  const facultyId = searchParams.get("facultyId") || undefined;

  let rawAssignments: any[] = [];
  let dbSubmissionsMap: Record<string, any[]> = {};

  try {
    await connectToDatabase();
    const query: any = {};
    if (subjectId) query.subjectId = subjectId;
    if (departmentId) query.departmentId = departmentId;
    if (semesterNumber) query.semesterNumber = semesterNumber;
    if (facultyId) query.facultyId = facultyId;

    const dbAssignments = await AssignmentModel.find(query).sort({ deadline: 1 }).lean();
    if (dbAssignments && dbAssignments.length > 0) {
      rawAssignments = dbAssignments.map((assignment: any) => ({
        ...assignment,
        assignmentType: getAssignmentType(assignment.assignmentType),
        allowedFileTypes:
          assignment.allowedFileTypes ||
          getAssignmentConfig(assignment.assignmentType).allowedFileTypes,
        maxFileSize: assignment.maxFileSize || 25 * 1024 * 1024,
        maxFiles:
          assignment.maxFiles ?? getAssignmentConfig(assignment.assignmentType).maxFiles,
        _id: undefined,
        deadline: assignment.deadline.toISOString(),
        createdAt: assignment.createdAt.toISOString(),
      }));
    } else {
      rawAssignments = store.getAssignments(subjectId).map((assignment) => ({
        ...assignment,
        assignmentType: getAssignmentType(assignment.assignmentType),
        allowedFileTypes:
          assignment.allowedFileTypes ||
          getAssignmentConfig(assignment.assignmentType).allowedFileTypes,
        maxFileSize: assignment.maxFileSize || 25 * 1024 * 1024,
        maxFiles:
          assignment.maxFiles ?? getAssignmentConfig(assignment.assignmentType).maxFiles,
      }));
    }

    // Query submissions from MongoDB for all retrieved assignments
    const assignmentIds = rawAssignments.map((a) => a.id);
    if (assignmentIds.length > 0) {
      const dbSubs = await AssignmentSubmission.find({
        assignmentId: { $in: assignmentIds },
      }).lean();

      dbSubs.forEach((sub: any) => {
        if (!dbSubmissionsMap[sub.assignmentId]) {
          dbSubmissionsMap[sub.assignmentId] = [];
        }
        dbSubmissionsMap[sub.assignmentId].push(sub);
      });
    }

    let activeStudents: any[] = [];
    try {
      const UserModel = (await import("@/models/User")).default;
      activeStudents = await UserModel.find({
        role: { $in: ["STUDENT", "CR"] },
        status: "ACTIVE",
      })
        .select("department branchId semester")
        .lean();
    } catch {}

    // Enrich with live database submission & evaluation statistics
    const enrichedAssignments = rawAssignments.map((assign) => {
      let subs = dbSubmissionsMap[assign.id];
      // Fall back to store if no DB submissions for this assignment yet
      if (!subs || subs.length === 0) {
        subs = store.getSubmissions(assign.id);
      }

      const totalSubmissions = subs.length;
      const evaluatedCount = subs.filter(
        (s) => s.status === "graded" && s.marks !== undefined
      ).length;
      const pendingCount = totalSubmissions - evaluatedCount;
      const isPastDeadline = new Date(assign.deadline).getTime() < Date.now();
      const lateCount = subs.filter(
        (s) =>
          s.status === "late" ||
          (s.submittedAt && new Date(s.submittedAt) > new Date(assign.deadline))
      ).length;
      const totalScore = subs
        .filter((s) => s.status === "graded" && s.marks !== undefined)
        .reduce((acc, s) => acc + (s.marks || 0), 0);
      const averageScore =
        evaluatedCount > 0 ? Math.round((totalScore / evaluatedCount) * 10) / 10 : 0;
      const progressPercentage =
        totalSubmissions > 0 ? Math.round((evaluatedCount / totalSubmissions) * 100) : 0;

      const deptCode = (assign.departmentId || "").replace("dept-", "").toUpperCase();
      const enrolledForAssignment = activeStudents.filter((st: any) => {
        if (assign.semesterNumber && st.semester && st.semester !== assign.semesterNumber) {
          return false;
        }
        if (deptCode && st.department && st.department.toUpperCase() !== deptCode) {
          return false;
        }
        return true;
      });

      const totalStudents = Math.max(
        enrolledForAssignment.length > 0 ? enrolledForAssignment.length : (activeStudents.length || 6),
        totalSubmissions
      );
      const notSubmittedCount = Math.max(0, totalStudents - totalSubmissions);

      let evaluationStatus: "NO_SUBMISSIONS" | "PENDING_EVALUATION" | "FULLY_EVALUATED" =
        "NO_SUBMISSIONS";
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
        totalStudents,
        notSubmittedCount,
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
  } catch (error) {
    console.error("Assignment database read failed; using local fallback.", error);
    rawAssignments = store.getAssignments(subjectId);
    return NextResponse.json({
      assignments: rawAssignments.map((a) => ({
        ...a,
        totalSubmissions: 0,
        totalStudents: 6,
        notSubmittedCount: 6,
        pendingCount: 0,
        evaluatedCount: 0,
        lateCount: 0,
        averageScore: 0,
        progressPercentage: 0,
        isPastDeadline: false,
        evaluationStatus: "NO_SUBMISSIONS",
      })),
    });
  }
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

    await connectToDatabase();

    // Check subject from DB or store
    let subject: any = null;
    try {
      const SubjectModel = (await import("@/models/Subject")).default;
      subject = await SubjectModel.findOne({ id: subjectId }).lean();
    } catch {}

    if (!subject) {
      subject = store.getSubjectById(subjectId);
    }

    if (!subject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    const modules = subject.modules || store.getModules(subject.id);
    const mod = modules.find((m: any) => m.id === moduleId) || modules[0] || {
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
      instructions:
        instructions.length > 0
          ? instructions
          : [
              "Read problem statement carefully before answering.",
              "Plagiarism detection is active. Do not share solution code.",
            ],
      assignmentType: normalizedType,
      allowedFileTypes: typeConfig.allowedFileTypes,
      maxFileSize: Math.min(
        Math.max(Number(maxFileSize) || 25 * 1024 * 1024, 1024),
        100 * 1024 * 1024
      ),
      maxFiles: Math.min(
        Math.max(Number(maxFiles ?? typeConfig.maxFiles), normalizedType === "text" ? 0 : 1),
        10
      ),
      createdAt: new Date().toISOString(),
    };

    const saved = await AssignmentModel.create(newAssignment);
    store.createAssignment(newAssignment);
    await createAssignmentNotification(newAssignment);
    return NextResponse.json({ success: true, assignment: saved }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to create assignment" },
      { status }
    );
  }
}
