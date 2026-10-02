import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import FacultySubject from "@/models/FacultySubject";
import SubjectModel from "@/models/Subject";
import { ensureSyllabusSubjectsInDB } from "@/lib/syllabus-catalog";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["FACULTY", "ADMIN"]);
    await connectToDatabase();
    await ensureSyllabusSubjectsInDB();

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const semesterNumber = searchParams.get("semesterNumber")
      ? Number(searchParams.get("semesterNumber"))
      : undefined;

    // Faculty can only fetch their own assigned subjects; Admin can optionally specify facultyId
    const facultyId =
      user.role === "ADMIN" && searchParams.get("facultyId")
        ? searchParams.get("facultyId")!
        : user.id;

    const query: any = {
      facultyId,
      status: "ACTIVE",
    };

    if (departmentId && departmentId !== "ALL") {
      const norm = departmentId.replace(/^(dept-|department-)/i, "").toUpperCase();
      query.$or = [
        { departmentId },
        { branchCode: norm },
        { departmentId: `dept-${norm.toLowerCase()}` },
      ];
    }
    if (semesterNumber && !isNaN(semesterNumber)) {
      query.semesterNumber = semesterNumber;
    }

    const assignedDocs = await FacultySubject.find(query)
      .sort({ semesterNumber: 1, subjectCode: 1 })
      .lean();

    // Enrich with subject details (credits, modules, description) from SubjectModel
    const subjectIds = assignedDocs.map((a) => a.subjectId);
    const dbSubjects = await SubjectModel.find({ id: { $in: subjectIds } }).lean();
    const subjectMap = new Map(dbSubjects.map((s) => [s.id, s]));

    const assignedSubjects = assignedDocs.map((assignment) => {
      const detail = subjectMap.get(assignment.subjectId);
      return {
        id: assignment.subjectId,
        assignmentId: assignment.id,
        code: assignment.subjectCode,
        name: assignment.subjectName,
        departmentId: assignment.departmentId,
        branchCode: assignment.branchCode,
        semesterNumber: assignment.semesterNumber,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy,
        credits: detail?.credits || 3,
        description: detail?.description || "",
        modulesCount: detail?.modulesCount || detail?.modules?.length || 0,
        modules: detail?.modules || [],
      };
    });

    return NextResponse.json({
      success: true,
      assignedSubjects,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch faculty assigned subjects." },
      { status }
    );
  }
}
