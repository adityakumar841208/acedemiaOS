import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import SubjectModel from "@/models/Subject";
import { Subject } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get("deptId") || undefined;
  const semParam = searchParams.get("sem") || searchParams.get("semesterNumber") || undefined;
  const semNumber = semParam ? Number(semParam) : undefined;

  const departments = store.getDepartments();
  const semesters = store.getSemesters();

  let subjects: any[] = [];
  try {
    await connectToDatabase();
    const { ensureSyllabusSubjectsInDB } = await import("@/lib/syllabus-catalog");
    await ensureSyllabusSubjectsInDB();

    const query: any = {};
    if (deptId && deptId !== "ALL") {
      const norm = deptId.replace(/^(dept-|department-)/i, "").toUpperCase();
      query.$or = [
        { departmentId: deptId },
        { departmentId: `dept-${norm.toLowerCase()}` },
        { departmentId: norm },
      ];
    }
    if (semNumber && !isNaN(semNumber)) {
      query.semesterNumber = semNumber;
    }

    const dbSubjects = await SubjectModel.find(query).sort({ code: 1 }).lean();
    if (dbSubjects && dbSubjects.length > 0) {
      subjects = dbSubjects.map((s: any) => ({
        ...s,
        _id: s._id ? s._id.toString() : s.id,
      }));
    } else {
      subjects = store.getSubjects(deptId, semNumber);
    }
  } catch {
    subjects = store.getSubjects(deptId, semNumber);
  }

  const modules = store.getModules();

  return NextResponse.json({
    departments,
    semesters,
    subjects,
    modules,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    // STRICT CHECK: Subjects can only be created by CR
    if (user.role !== "CR") {
      return NextResponse.json(
        {
          error: "Forbidden: Subjects and modules are editable by Class Representatives (CR) only.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { code, name, facultyName, credits, description, references, modules } = body;

    if (!code || typeof code !== "string" || code.trim().length < 2) {
      return NextResponse.json(
        { error: "Subject code is required (min 2 characters)." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Subject name is required (min 2 characters)." },
        { status: 400 }
      );
    }

    const departmentId = user.department.toLowerCase().startsWith("dept-")
      ? user.department
      : `dept-${user.department.toLowerCase()}`;
    const semesterNumber = user.semester || 3;

    const id = `sub-${code.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString(36)}`;

    const newSubject: Subject = {
      id,
      departmentId,
      semesterNumber,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      facultyId: `user-faculty-${Date.now()}`,
      facultyName: (facultyName || "TBD Faculty").trim(),
      credits: Number(credits) || 3,
      color: "from-indigo-600 to-blue-600",
      description: (description || "").trim(),
      modulesCount: Array.isArray(modules) ? modules.length : 0,
      references: Array.isArray(references) ? references : [],
      syllabusUpdatedAt: new Date().toISOString(),
      syllabusUpdatedBy: user.name,
    };

    store.createSubject(newSubject, modules);

    try {
      await connectToDatabase();
      await SubjectModel.create({
        id: newSubject.id,
        departmentId: newSubject.departmentId,
        semesterNumber: newSubject.semesterNumber,
        code: newSubject.code,
        name: newSubject.name,
        facultyName: newSubject.facultyName,
        credits: newSubject.credits,
        color: newSubject.color,
        description: newSubject.description,
        modulesCount: newSubject.modulesCount,
        references: newSubject.references,
        modules: Array.isArray(modules) ? modules : [],
        syllabusUpdatedAt: new Date(),
        syllabusUpdatedBy: user.name,
      });
    } catch (dbErr) {
      console.warn("MongoDB sync skipped or failed; store updated in-memory:", dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Subject created successfully by CR.",
        subject: newSubject,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating subject:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create subject." },
      { status: 500 }
    );
  }
}
