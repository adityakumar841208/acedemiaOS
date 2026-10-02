import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { dateKey, dateValue, getEnrolledStudents, getFacultySubject } from "@/lib/attendance";

function datesBetween(from: string, to: string) {
  const dates: string[] = [];
  for (let cursor = dateValue(from); cursor <= dateValue(to); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["FACULTY", "ADMIN"]);
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId") || "";
    const from = dateKey(searchParams.get("from") || "");
    const to = dateKey(searchParams.get("to") || "");
    if (!subjectId) return NextResponse.json({ error: "Select an assigned subject before downloading a template." }, { status: 400 });
    if (from > to) return NextResponse.json({ error: "The template start date must be before the end date." }, { status: 400 });

    const subject = await getFacultySubject(subjectId, user.id, user.department, user.name, user.role === "ADMIN");
    const students = await getEnrolledStudents(subject);
    const dates = datesBetween(from, to);
    const headers = ["Roll No.", "Student Name", "Student ID", ...dates, "Total Present", "Total Absent", "Working Days", "Attendance %"];
    const rows = students.map((student) => [student.rollNumber, student.name, student.id, ...dates.map(() => ""), "", "", "", ""]);

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Subject", subject.code, "Semester", subject.semesterNumber, "Instructions", "Enter P, A, or H in each date column."],
      headers,
      ...rows,
    ]);
    sheet["!freeze"] = { xSplit: 3, ySplit: 2 };
    XLSX.utils.book_append_sheet(workbook, sheet, "Attendance Register");
    const legend = XLSX.utils.aoa_to_sheet([["Value", "Meaning"], ["P", "Present"], ["A", "Absent"], ["H", "Holiday; excluded from working days"]]);
    XLSX.utils.book_append_sheet(workbook, legend, "Legend");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${subject.code}-attendance-register-template-${from}-to-${to}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to generate attendance register template." }, { status: error.status || 400 });
  }
}
