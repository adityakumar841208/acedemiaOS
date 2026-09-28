import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import connectToDatabase from "@/lib/db";
import Assignment from "@/models/Assignment";
import User from "@/models/User";

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
  let assignment = store.getAssignmentById(id);
  try {
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
  } catch (error) {
    console.error("Assignment database detail read failed; using local fallback.", error);
  }
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const submissions = store.getSubmissions(id);

  // Determine enrolled students from DB or fallback roster
  let enrolledStudents: any[] = [];
  try {
    await connectToDatabase();
    const dbStudents = await User.find({
      role: { $in: ["STUDENT", "CR"] },
      status: "ACTIVE",
    }).select("name rollNumber email department semester").lean();
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

  // Submitted student IDs & rolls
  const submittedIds = new Set(submissions.map((s) => s.studentId));
  const submittedRolls = new Set(submissions.map((s) => s.studentRoll));

  // Compute Not Submitted category
  const notSubmittedStudents = enrolledStudents.filter(
    (student) => !submittedIds.has(student.id) && !submittedRolls.has(student.rollNumber)
  );

  // Categorize submissions
  const pendingSubmissions = submissions.filter((s) => s.status !== "graded" || s.marks === undefined);
  const evaluatedSubmissions = submissions.filter((s) => s.status === "graded" && s.marks !== undefined);
  const lateSubmissions = submissions.filter(
    (s) => s.status === "late" || (s.submittedAt && new Date(s.submittedAt) > new Date(assignment!.deadline))
  );

  const totalScore = evaluatedSubmissions.reduce((acc, s) => acc + (s.marks || 0), 0);
  const averageScore = evaluatedSubmissions.length > 0 ? Math.round((totalScore / evaluatedSubmissions.length) * 10) / 10 : 0;
  const progressPercentage = submissions.length > 0 ? Math.round((evaluatedSubmissions.length / submissions.length) * 100) : 0;

  return NextResponse.json({
    assignment,
    submissionsCount: submissions.length,
    submissions,
    categories: {
      pending: pendingSubmissions,
      evaluated: evaluatedSubmissions,
      late: lateSubmissions,
      notSubmitted: notSubmittedStudents,
    },
    stats: {
      totalReceived: submissions.length,
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
