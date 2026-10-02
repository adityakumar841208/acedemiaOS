import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import connectToDatabase from "@/lib/db";
import { requireRole } from "@/lib/auth";
import Attendance from "@/models/Attendance";
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
    if (from > to) return NextResponse.json({ error: "The start date must be before the end date." }, { status: 400 });

    const subject = await getFacultySubject(subjectId, user.id, user.department, user.name, user.role === "ADMIN");
    const students = await getEnrolledStudents(subject);
    const dates = datesBetween(from, to);
    const sessions = await Attendance.find({
      subjectId,
      branchCode: subject.departmentId.replace(/^(dept-|department-)/i, ""),
      semesterNumber: subject.semesterNumber,
      date: { $gte: dateValue(from), $lte: dateValue(to) },
    }).sort({ date: 1 }).lean();
    const sessionMap = new Map(sessions.map((session: any) => [session.date.toISOString().slice(0, 10), session]));
    const headers = ["Roll No.", "Student Name", "Student ID", ...dates, "Total Present", "Total Absent", "Working Days", "Attendance %"];
    const rows = students.map((student) => {
      let present = 0;
      let absent = 0;
      const values = dates.map((date) => {
        const session: any = sessionMap.get(date);
        if (!session || session.dayType === "holiday") return session?.dayType === "holiday" ? "H" : "";
        const status = session.records.find((record: any) => record.studentId === student.id)?.status;
        if (status === "present") present += 1;
        if (status === "absent") absent += 1;
        return status === "present" ? "P" : status === "absent" ? "A" : "";
      });
      const workingDays = present + absent;
      return [student.rollNumber, student.name, student.id, ...values, present, absent, workingDays, workingDays ? `${Math.round((present / workingDays) * 1000) / 10}%` : "0%"];
    });

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Subject", subject.code, "Semester", subject.semesterNumber, "Range", `${from} to ${to}`],
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
        "Content-Disposition": `attachment; filename="${subject.code}-attendance-register-${from}-to-${to}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to export attendance." }, { status: error.status || 400 });
  }
}
