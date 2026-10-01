import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["FACULTY", "ADMIN"]);
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Date", "Roll Number", "Student ID", "Student Name", "Attendance", "Holiday Name"],
      ["2026-10-01", "101", "STU001", "Student name", "Present", ""],
    ]);
    const holidayExample = XLSX.utils.aoa_to_sheet([
      ["Date", "Roll Number", "Student ID", "Student Name", "Attendance", "Holiday Name"],
      ["2026-10-02", "", "", "", "Holiday", "Gandhi Jayanti"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");
    XLSX.utils.book_append_sheet(workbook, holidayExample, "Holiday Example");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=attendance-template.xlsx",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to generate template." }, { status: error.status || 400 });
  }
}
