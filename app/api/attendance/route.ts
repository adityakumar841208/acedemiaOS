import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import { SubjectModel } from "@/models/Subject";
import User from "@/models/User";
import { assertNotFuture, dateKey, getEnrolledStudents, getFacultySubject, normalizeAttendance, normalizeDepartment } from "@/lib/attendance";

function errorResponse(error: any) {
  return NextResponse.json({ error: error.message || "Attendance request failed." }, { status: error.status || 400 });
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "subjects";
    const subjectId = searchParams.get("subjectId") || "";

    if (view === "subjects") {
      const subjects = await SubjectModel.find({}).sort({ semesterNumber: 1, code: 1 }).lean();
      const visible = user.role === "ADMIN"
        ? subjects
        : subjects.filter((subject: any) => subject.facultyId === user.id || subject.facultyName === user.name || (!subject.facultyId && !subject.facultyName && normalizeDepartment(subject.departmentId) === normalizeDepartment(user.department)));
      return NextResponse.json({ subjects: visible.map((subject: any) => ({ ...subject, _id: undefined })) });
    }

    if (view === "students") {
      if (!subjectId) return NextResponse.json({ error: "Select a subject first." }, { status: 400 });
      const subject = await getFacultySubject(subjectId, user.id, user.department, user.name, user.role === "ADMIN");
      const students = await getEnrolledStudents(subject);
      const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
      const existing = await Attendance.findOne({ subjectId, branchCode: normalizeDepartment(subject.departmentId), semesterNumber: subject.semesterNumber, date: new Date(`${date}T00:00:00.000Z`) }).lean();
      return NextResponse.json({ subject, students, attendance: existing });
    }

    if (view === "history") {
      if (user.role !== "FACULTY" && user.role !== "ADMIN") return NextResponse.json({ error: "Faculty access required." }, { status: 403 });
      const subjects = await SubjectModel.find(user.role === "ADMIN" ? {} : {
        $or: [
          { facultyId: user.id },
          { facultyName: user.name },
          {
            $and: [
              { facultyId: { $in: [null, ""] } },
              { facultyName: { $in: [null, ""] } },
              { departmentId: new RegExp(normalizeDepartment(user.department), "i") },
            ],
          },
        ],
      }).select("id code name").lean();
      const subjectIds = subjectId ? [subjectId] : subjects.map((subject: any) => subject.id);
      const sessions = await Attendance.find({ subjectId: { $in: subjectIds } }).sort({ date: -1 }).limit(100).lean();
      return NextResponse.json({
        sessions: sessions.map((session: any) => ({
          ...session,
          subject: subjects.find((subject: any) => subject.id === session.subjectId),
        })),
        subjects,
      });
    }

    if (view === "student-summary") {
      const studentId = user.role === "STUDENT" || user.role === "CR" ? user.id : searchParams.get("studentId");
      if (!studentId) return NextResponse.json({ error: "Student identity is required." }, { status: 400 });
      if ((user.role === "STUDENT" || user.role === "CR") && studentId !== user.id) return NextResponse.json({ error: "You can only view your own attendance." }, { status: 403 });
      const student = await User.findById(studentId).select("department semester name rollNumber").lean() as any;
      if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });
      const subjects = await SubjectModel.find({ semesterNumber: student.semester }).select("id code name departmentId").lean();
      const sessions = await Attendance.find({ subjectId: { $in: subjects.map((subject: any) => subject.id) }, "records.studentId": studentId }).sort({ date: -1 }).lean();
      const summary = subjects.map((subject: any) => {
        const records = sessions.filter((session: any) => session.subjectId === subject.id).map((session: any) => session.records.find((record: any) => record.studentId === studentId)).filter(Boolean);
        const present = records.filter((record: any) => record.status === "present").length;
        return { ...subject, presentClasses: present, totalClasses: records.length, percentage: records.length ? Math.round((present / records.length) * 1000) / 10 : null };
      });
      return NextResponse.json({ student, summary, sessions: sessions.map((session: any) => ({
        ...session,
        records: session.records.filter((record: any) => record.studentId === studentId),
        subject: subjects.find((subject: any) => subject.id === session.subjectId),
      })) });
    }

    return NextResponse.json({ error: "Unknown attendance view." }, { status: 400 });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["FACULTY", "ADMIN"]);
    await connectToDatabase();
    const body = await req.json();
    const subjectId = String(body.subjectId || "");
    const date = dateKey(body.date);
    assertNotFuture(date);
    const subject = await getFacultySubject(subjectId, user.id, user.department, user.name, user.role === "ADMIN");
    const students = await getEnrolledStudents(subject);
    const enrolledIds = new Set(students.map((student) => student.id));
    const records = Array.isArray(body.records) ? body.records : [];
    if (!records.length) return NextResponse.json({ error: "Attendance must include at least one student." }, { status: 400 });
    const seen = new Set<string>();
    const normalizedRecords = records.map((record: any) => {
      const studentId = String(record.studentId || "");
      if (!enrolledIds.has(studentId)) throw new Error("Attendance includes a student outside this class.");
      if (seen.has(studentId)) throw new Error("Attendance contains a duplicate student.");
      seen.add(studentId);
      return { studentId, status: normalizeAttendance(record.status) };
    });
    if (normalizedRecords.length !== students.length) return NextResponse.json({ error: "Attendance must include every enrolled student." }, { status: 400 });
    const session = await Attendance.findOneAndUpdate(
      { subjectId, branchCode: normalizeDepartment(subject.departmentId), semesterNumber: subject.semesterNumber, date: new Date(`${date}T00:00:00.000Z`) },
      { $set: { subjectId, facultyId: user.id, branchId: String(subject.departmentId), branchCode: normalizeDepartment(subject.departmentId), semesterNumber: subject.semesterNumber, date: new Date(`${date}T00:00:00.000Z`), records: normalizedRecords } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json({ success: true, session, message: "Attendance saved." });
  } catch (error: any) {
    return errorResponse(error);
  }
}
