import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import { SubjectModel } from "@/models/Subject";
import User from "@/models/User";
import { assertNotFuture, dateKey, dateValue, getEnrolledStudents, getFacultySubject, normalizeAttendance, normalizeDepartment } from "@/lib/attendance";

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
      const ownership = user.role === "ADMIN" ? {} : {
        $or: [
          { facultyId: user.id },
          { facultyName: user.name },
          { facultyId: { $in: [null, ""] }, facultyName: { $in: [null, ""] }, departmentId: new RegExp(`^(dept-|department-)?${normalizeDepartment(user.department)}$`, "i") },
        ],
      };
      const subjects = await SubjectModel.find(ownership).select("id code name departmentId semesterNumber facultyId facultyName").sort({ semesterNumber: 1, code: 1 }).lean();
      return NextResponse.json({ subjects });
    }

    if (view === "students") {
      if (!subjectId) return NextResponse.json({ error: "Select a subject first." }, { status: 400 });
      const subject = await getFacultySubject(subjectId, user.id, user.department, user.name, user.role === "ADMIN");
      const students = await getEnrolledStudents(subject);
      const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
      const existing = await Attendance.findOne({ subjectId, branchCode: normalizeDepartment(subject.departmentId), semesterNumber: subject.semesterNumber, date: dateValue(date) }).lean();
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
      const subjects = await SubjectModel.find({ semesterNumber: student.semester, departmentId: new RegExp(`^(dept-|department-)?${normalizeDepartment(student.department)}$`, "i") }).select("id code name departmentId").lean();
      const sessions = await Attendance.find({ subjectId: { $in: subjects.map((subject: any) => subject.id) }, $or: [{ dayType: "holiday" }, { dayType: { $in: ["attendance", null] }, "records.studentId": studentId }] }).select("subjectId date dayType holidayName records").sort({ date: -1 }).lean();
      const summary = subjects.map((subject: any) => {
        const records = sessions.filter((session: any) => session.subjectId === subject.id && session.dayType !== "holiday").map((session: any) => session.records.find((record: any) => record.studentId === studentId)).filter(Boolean);
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
    const dayType = body.dayType === "holiday" ? "holiday" : "attendance";
    if (dayType === "holiday") {
      const session = await Attendance.findOneAndUpdate(
        { subjectId, branchCode: normalizeDepartment(subject.departmentId), semesterNumber: subject.semesterNumber, date: dateValue(date) },
        { $set: { subjectId, facultyId: user.id, branchId: String(subject.departmentId), branchCode: normalizeDepartment(subject.departmentId), semesterNumber: subject.semesterNumber, date: dateValue(date), dayType, holidayName: String(body.holidayName || "Holiday").trim(), records: [] } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ success: true, session, message: "Holiday saved." });
    }
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
      { $set: { subjectId, facultyId: user.id, branchId: String(subject.departmentId), branchCode: normalizeDepartment(subject.departmentId), semesterNumber: subject.semesterNumber, date: dateValue(date), dayType: "attendance", holidayName: undefined, records: normalizedRecords } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json({ success: true, session, message: "Attendance saved." });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(["FACULTY", "ADMIN"]);
    await connectToDatabase();
    const body = await req.json();
    const subject = await getFacultySubject(String(body.subjectId || ""), user.id, user.department, user.name, user.role === "ADMIN");
    const entries = Array.isArray(body.entries) ? body.entries : [];
    if (!entries.length || entries.length > 366) return NextResponse.json({ error: "Provide between 1 and 366 attendance dates." }, { status: 400 });
    const students = await getEnrolledStudents(subject);
    const enrolledIds = new Set(students.map((student) => student.id));
    const operations = entries.map((entry: any) => {
      const date = dateKey(String(entry.date || ""));
      assertNotFuture(date);
      const key = { subjectId: subject.id, branchCode: normalizeDepartment(subject.departmentId), semesterNumber: subject.semesterNumber, date: dateValue(date) };
      if (entry.type === "holiday") return { updateOne: { filter: key, update: { $set: { ...key, facultyId: user.id, branchId: String(subject.departmentId), dayType: "holiday", holidayName: String(entry.holidayName || "Holiday").trim(), records: [] } as any, upsert: true } } };
      const records = Array.isArray(entry.records) ? entry.records : [];
      if (records.length !== students.length) throw new Error(`${date}: attendance must include every enrolled student.`);
      const seen = new Set<string>();
      const normalizedRecords = records.map((record: any) => {
        const studentId = String(record.studentId || "");
        if (!enrolledIds.has(studentId) || seen.has(studentId)) throw new Error(`${date}: invalid or duplicate student record.`);
        seen.add(studentId);
        return { studentId, status: normalizeAttendance(record.status) };
      });
      return { updateOne: { filter: key, update: { $set: { ...key, facultyId: user.id, branchId: String(subject.departmentId), dayType: "attendance", holidayName: undefined, records: normalizedRecords } as any, upsert: true } } };
    });
    const result = await Attendance.bulkWrite(operations, { ordered: true });
    return NextResponse.json({ success: true, matched: result.matchedCount, upserted: result.upsertedCount, message: "Attendance dates saved." });
  } catch (error: any) {
    return errorResponse(error);
  }
}
