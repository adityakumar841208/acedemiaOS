import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import connectToDatabase from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assertNotFuture, dateKey, getEnrolledStudents, getFacultySubject } from "@/lib/attendance";

const dateHeader = /^\d{4}-\d{2}-\d{2}$/;

type ImportEntry = {
  date: string;
  type?: "holiday";
  holidayName?: string;
  records?: Array<{ studentId: string; status: "present" | "absent" }>;
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["FACULTY", "ADMIN"]);
    await connectToDatabase();
    const formData = await req.formData();
    const subjectId = String(formData.get("subjectId") || "");
    const file = formData.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ error: "Upload the downloaded .xlsx attendance register." }, { status: 400 });
    }

    const subject = await getFacultySubject(subjectId, user.id, user.department, user.name, user.role === "ADMIN");
    const students = await getEnrolledStudents(subject);
    const byId = new Map(students.map((student) => [student.id, student]));
    const byRoll = new Map(students.map((student) => [student.rollNumber.toLowerCase(), student]));
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    const sheet = workbook.Sheets["Attendance Register"] || workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return NextResponse.json({ error: "The workbook is empty." }, { status: 400 });

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 1, defval: "" });
    const firstRow = rows[0] || {};
    const dateColumns = Object.keys(firstRow).filter((key) => dateHeader.test(key));
    if (!dateColumns.length) return NextResponse.json({ error: "No YYYY-MM-DD attendance date columns were found." }, { status: 400 });
    dateColumns.forEach((date) => assertNotFuture(dateKey(date)));

    const errors: string[] = [];
    const rowStudents = new Map<string, string>();
    rows.forEach((row, index) => {
      const rowNumber = index + 3;
      const studentId = String(row["Student ID"] || "").trim();
      const rollNumber = String(row["Roll No."] || row["Roll Number"] || "").trim();
      const student = (studentId && byId.get(studentId)) || (rollNumber && byRoll.get(rollNumber.toLowerCase()));
      if (!student) {
        errors.push(`Row ${rowNumber}: Student ID or Roll No. does not belong to this class.`);
        return;
      }
      if (rowStudents.has(student.id)) {
        errors.push(`Row ${rowNumber}: duplicate student ${student.rollNumber}.`);
        return;
      }
      rowStudents.set(student.id, student.id);
    });

    const entries: ImportEntry[] = [];
    for (const date of dateColumns) {
      const statuses = new Map<string, "present" | "absent">();
      let holiday = false;
      let hasValue = false;
      rows.forEach((row, index) => {
        const studentId = rowStudents.get(String(row["Student ID"] || "").trim()) || byRoll.get(String(row["Roll No."] || row["Roll Number"] || "").trim().toLowerCase())?.id;
        if (!studentId) return;
        const value = String(row[date] || "").trim().toUpperCase();
        if (!value) return;
        hasValue = true;
        if (value === "H") {
          holiday = true;
          return;
        }
        if (value === "P" || value === "A") {
          statuses.set(studentId, value === "P" ? "present" : "absent");
          return;
        }
        errors.push(`Row ${index + 3}, ${date}: use only P, A, or H.`);
      });
      if (!hasValue) continue;
      if (holiday && statuses.size) {
        errors.push(`${date}: holiday columns cannot contain P or A values.`);
      } else if (holiday) {
        entries.push({ date, type: "holiday", holidayName: "Holiday" });
      } else if (statuses.size !== students.length) {
        errors.push(`${date}: every enrolled student must have P or A.`);
      } else {
        entries.push({ date, records: Array.from(statuses, ([studentId, status]) => ({ studentId, status })) });
      }
    }

    return NextResponse.json({
      preview: {
        subject: { id: subject.id, code: subject.code, name: subject.name },
        entries,
        dates: entries.map((entry) => entry.date),
        errors,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to import attendance register." }, { status: error.status || 400 });
  }
}
