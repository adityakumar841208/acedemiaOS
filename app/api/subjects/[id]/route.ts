import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import SubjectModel from "@/models/Subject";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const subject = store.getSubjectById(id);
  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const modules = store.getModules(subject.id);
  const resources = store.getResources({ subjectId: subject.id });
  const assignments = store.getAssignments(subject.id);

  return NextResponse.json({
    subject,
    modules,
    resources,
    assignments,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to manage syllabus." },
        { status: 401 }
      );
    }

    // 2. Strict Role Check: CR ONLY (Neither Admin, Faculty, nor Student may edit subjects/modules)
    if (user.role !== "CR") {
      return NextResponse.json(
        {
          error: "Forbidden: Subjects and modules are editable by Class Representatives (CR) only.",
        },
        { status: 403 }
      );
    }

    // 3. Locate Subject
    const subject = store.getSubjectById(id);
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // 4. Strict Scope Check: CR must belong to the same department and semester
    const normalizeDept = (val?: string) =>
      (val || "").toLowerCase().replace(/^(dept-|department-)/, "").trim();

    const userDept = normalizeDept(user.department);
    const subjectDept = normalizeDept(subject.departmentId);

    const deptMatches = !userDept || !subjectDept || userDept === subjectDept;
    const semMatches =
      user.semester === undefined ||
      user.semester === null ||
      Number(user.semester) === Number(subject.semesterNumber);

    if (!deptMatches || !semMatches) {
      return NextResponse.json(
        {
          error: `Forbidden: As a CR for ${user.department || "your department"} (Semester ${user.semester || "?"}), you are only authorized to manage syllabus for subjects within your assigned department and semester.`,
        },
        { status: 403 }
      );
    }

    // 5. Parse and validate payload
    const body = await req.json();
    const { name, code, facultyName, description, credits, references, modules } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      return NextResponse.json(
        { error: "Subject name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    if (code !== undefined && (typeof code !== "string" || code.trim().length < 2)) {
      return NextResponse.json(
        { error: "Subject code must be at least 2 characters long." },
        { status: 400 }
      );
    }

    if (credits !== undefined && (typeof credits !== "number" || credits < 0)) {
      return NextResponse.json(
        { error: "Credits must be a non-negative number." },
        { status: 400 }
      );
    }

    if (modules !== undefined) {
      if (!Array.isArray(modules)) {
        return NextResponse.json(
          { error: "Modules must be an array." },
          { status: 400 }
        );
      }

      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        if (!mod.title || typeof mod.title !== "string" || !mod.title.trim()) {
          return NextResponse.json(
            { error: `Module #${i + 1} must have a valid title.` },
            { status: 400 }
          );
        }
      }
    }

    // 6. Update in Store
    const updated = store.updateSubjectSyllabus(subject.id, {
      name,
      code,
      facultyName,
      description,
      credits: credits !== undefined ? Number(credits) : undefined,
      references: Array.isArray(references) ? references : undefined,
      modules,
      updatedBy: user.name,
    });

    // 7. Persist to MongoDB (if database is connected)
    try {
      await connectToDatabase();
      await SubjectModel.findOneAndUpdate(
        { id: subject.id },
        {
          $set: {
            departmentId: subject.departmentId,
            semesterNumber: subject.semesterNumber,
            name: updated.subject.name,
            code: updated.subject.code,
            facultyName: updated.subject.facultyName,
            description: updated.subject.description,
            credits: updated.subject.credits,
            references: updated.subject.references || [],
            modulesCount: updated.modules.length,
            modules: updated.modules.map((m) => ({
              id: m.id,
              moduleNumber: m.moduleNumber,
              title: m.title,
              description: m.description,
              topics: m.topics,
            })),
            syllabusUpdatedAt: new Date(),
            syllabusUpdatedBy: user.name,
          },
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn("MongoDB sync skipped or failed; store updated in-memory:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Syllabus and modules updated successfully.",
      subject: updated.subject,
      modules: updated.modules,
    });
  } catch (err: any) {
    console.error("Error updating subject/modules:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update subject syllabus." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(req, context);
}
