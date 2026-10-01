import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import connectToDatabase from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assertNotFuture, dateKey, getEnrolledStudents, getFacultySubject, normalizeAttendance } from "@/lib/attendance";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["FACULTY", "ADMIN"]);
    await connectToDatabase();
    const formData = await req.formData();
    const subjectId = String(formData.get("subjectId") || "");
    const date = dateKey(String(formData.get("date") || ""));
    assertNotFuture(date);
    const file = formData.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ error: "Upload an .xlsx attendance file." }, { status: 400 });
    }
    const subject = await getFacultySubject(subjectId, user.id, user.department, user.name, user.role === "ADMIN");
    const students = await getEnrolledStudents(subject);
    const byId = new Map(students.map((student) => [student.id, student]));
    const byRoll = new Map(students.map((student) => [student.rollNumber.toLowerCase(), student]));
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return NextResponse.json({ error: "The workbook is empty." }, { status: 400 });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
    const errors: string[] = [];
    const seen = new Set<string>();
    const records: Array<{ studentId: string; status: "present" | "absent"; name: string; rollNumber: string }> = [];
    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const studentId = String(row["Student ID"] || row["studentId"] || "").trim();
      const rollNumber = String(row["Roll Number"] || row["rollNumber"] || "").trim();
      const student = (studentId && byId.get(studentId)) || (rollNumber && byRoll.get(rollNumber.toLowerCase()));
      if (!student) {
        errors.push(`Row ${rowNumber}: student ID or roll number was not found in this class.`);
        return;
      }
      if (seen.has(student.id)) {
        errors.push(`Row ${rowNumber}: duplicate student ${student.rollNumber}.`);
        return;
      }
      try {
        const status = normalizeAttendance(row.Attendance || row.attendance);
        seen.add(student.id);
        records.push({ studentId: student.id, status, name: student.name, rollNumber: student.rollNumber });
      } catch {
        errors.push(`Row ${rowNumber}: attendance must be Present/P or Absent/A.`);
      }
    });
    const missing = students.filter((student) => !seen.has(student.id));
    missing.forEach((student) => errors.push(`${student.rollNumber}: student is missing from the import.`));
    return NextResponse.json({
      preview: {
        subject: { id: subject.id, code: subject.code, name: subject.name },
        date,
        studentsFound: records.length,
        present: records.filter((record) => record.status === "present").length,
        absent: records.filter((record) => record.status === "absent").length,
        errors,
        records,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to preview attendance import." }, { status: error.status || 400 });
  }
}
