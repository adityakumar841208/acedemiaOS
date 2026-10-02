import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import connectToDatabase from "@/lib/db";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { getAssignmentConfig, getAssignmentType } from "@/lib/assignment-types";

const DEFAULT_CLASS_ROSTER = [
  { id: "user-student-01", name: "Aditya Kumar", rollNumber: "CS22B1045", email: "aditya.student@campus.edu", department: "CSE", semester: 3 },
  { id: "user-student-02", name: "Aman Verma", rollNumber: "CS22B1015", email: "aman.v@campus.edu", department: "CSE", semester: 3 },
  { id: "user-student-03", name: "Rahul Gupta", rollNumber: "CS22B1028", email: "rahul.g@campus.edu", department: "CSE", semester: 3 },
  { id: "user-student-04", name: "Sneha Kulkarni", rollNumber: "CS22B1032", email: "sneha.k@campus.edu", department: "CSE", semester: 3 },
  { id: "user-student-05", name: "Vikram Patel", rollNumber: "CS22B1050", email: "vikram.p@campus.edu", department: "CSE", semester: 3 },
  { id: "user-student-06", name: "Ananya Deshmukh", rollNumber: "CS22B1008", email: "ananya.d@campus.edu", department: "CSE", semester: 3 },
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const viewer = await requireAuth();

  await connectToDatabase();

  let assignment: any = null;
  try {
    const databaseAssignment = await Assignment.findOne({ id }).lean();
    if (databaseAssignment) {
      assignment = {
        ...databaseAssignment,
        assignmentType: getAssignmentType(databaseAssignment.assignmentType),
        allowedFileTypes:
          databaseAssignment.allowedFileTypes ||
          getAssignmentConfig(databaseAssignment.assignmentType).allowedFileTypes,
        maxFileSize: databaseAssignment.maxFileSize || 25 * 1024 * 1024,
        maxFiles:
          databaseAssignment.maxFiles ??
          getAssignmentConfig(databaseAssignment.assignmentType).maxFiles,
        deadline: databaseAssignment.deadline.toISOString(),
        createdAt: databaseAssignment.createdAt.toISOString(),
      };
      store.ensureAssignment(assignment);
    }
  } catch (error) {
    console.error("Assignment database detail read failed:", error);
  }

  if (!assignment) {
    const storeAssign = store.getAssignmentById(id);
    if (storeAssign) {
      assignment = storeAssign;
    }
  }

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  // 1. Fetch persistent submissions from MongoDB
  let rawDbSubmissions: any[] = [];
  try {
    rawDbSubmissions = await AssignmentSubmission.find({ assignmentId: id })
      .sort({ submittedAt: -1 })
      .lean();
  } catch (err) {
    console.error("Failed to query AssignmentSubmission:", err);
  }

  // Fallback to store if DB has none (e.g. mock seed data)
  if (rawDbSubmissions.length === 0) {
    const storeSubs = store.getSubmissions(id);
    if (storeSubs.length > 0) {
      rawDbSubmissions = storeSubs.map((s) => ({
        ...s,
        submittedAt: new Date(s.submittedAt),
        gradedAt: s.gradedAt ? new Date(s.gradedAt) : undefined,
        evaluatedAt: s.evaluatedAt ? new Date(s.evaluatedAt) : s.gradedAt ? new Date(s.gradedAt) : undefined,
      }));
    }
  }

  const allSubmissions = rawDbSubmissions.map((s) => ({
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

  // Filter submissions by viewer role
  const isFacultyOrAdmin = viewer.role === "FACULTY" || viewer.role === "ADMIN";
  const visibleSubmissions = isFacultyOrAdmin
    ? allSubmissions
    : allSubmissions.filter((s) => s.studentId === viewer.id);

  // Determine enrolled students from DB or fallback roster
  let enrolledStudents: any[] = [];
  try {
    const dbStudents = await User.find({
      role: { $in: ["STUDENT", "CR"] },
      status: "ACTIVE",
    })
      .select("name rollNumber email department semester")
      .lean();

    if (dbStudents && dbStudents.length > 0) {
      enrolledStudents = dbStudents.map((s: any) => ({
        id: s._id.toString(),
        name: s.name,
        rollNumber: s.rollNumber || "N/A",
        email: s.email,
        department: s.department,
        semester: s.semester,
      }));
    } else {
      enrolledStudents = DEFAULT_CLASS_ROSTER;
    }
  } catch {
    enrolledStudents = DEFAULT_CLASS_ROSTER;
  }

  // Submitted student IDs & rolls across ALL submissions for this assignment
  const submittedIds = new Set(allSubmissions.map((s) => s.studentId));
  const submittedRolls = new Set(allSubmissions.map((s) => s.studentRoll));

  // Compute Not Submitted category from enrolled roster
  const notSubmittedStudents = enrolledStudents.filter(
    (student) => !submittedIds.has(student.id) && !submittedRolls.has(student.rollNumber)
  );

  // Categorize submissions
  const pendingSubmissions = allSubmissions.filter(
    (s) => s.status !== "graded" || s.marks === undefined
  );
  const evaluatedSubmissions = allSubmissions.filter(
    (s) => s.status === "graded" && s.marks !== undefined
  );
  const lateSubmissions = allSubmissions.filter(
    (s) =>
      s.status === "late" ||
      (s.submittedAt && new Date(s.submittedAt) > new Date(assignment.deadline))
  );

  const totalScore = evaluatedSubmissions.reduce((acc, s) => acc + (s.marks || 0), 0);
  const averageScore =
    evaluatedSubmissions.length > 0
      ? Math.round((totalScore / evaluatedSubmissions.length) * 10) / 10
      : 0;
  const progressPercentage =
    allSubmissions.length > 0
      ? Math.round((evaluatedSubmissions.length / allSubmissions.length) * 100)
      : 0;

  // Find viewer submission specifically for student view
  const userSubmission = allSubmissions.find((s) => s.studentId === viewer.id) || null;

  return NextResponse.json({
    assignment,
    submissionsCount: allSubmissions.length,
    submissions: visibleSubmissions,
    userSubmission,
    categories: {
      pending: isFacultyOrAdmin ? pendingSubmissions : pendingSubmissions.filter((s) => s.studentId === viewer.id),
      evaluated: isFacultyOrAdmin ? evaluatedSubmissions : evaluatedSubmissions.filter((s) => s.studentId === viewer.id),
      late: isFacultyOrAdmin ? lateSubmissions : lateSubmissions.filter((s) => s.studentId === viewer.id),
      notSubmitted: isFacultyOrAdmin ? notSubmittedStudents : [],
    },
    stats: {
      totalReceived: allSubmissions.length,
      pendingCount: pendingSubmissions.length,
      evaluatedCount: evaluatedSubmissions.length,
      lateCount: lateSubmissions.length,
      notSubmittedCount: notSubmittedStudents.length,
      totalEnrolled: enrolledStudents.length,
      averageScore,
      progressPercentage,
    },
  });
}
