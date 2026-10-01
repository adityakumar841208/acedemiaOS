import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["FACULTY", "ADMIN"]);
    const sheet = XLSX.utils.aoa_to_sheet([["Roll Number", "Student ID", "Student Name", "Attendance"], ["101", "STU001", "Student name", "Present"]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");
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
