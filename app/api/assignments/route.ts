import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Assignment } from "@/types";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AssignmentModel from "@/models/Assignment";
import { createAssignmentNotification } from "@/lib/services/notification.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId") || undefined;
  try {
    await connectToDatabase();
    const query = subjectId ? { subjectId } : {};
    const assignments = await AssignmentModel.find(query).sort({ deadline: 1 }).lean();
    return NextResponse.json({
      assignments: assignments.map((assignment) => ({
        ...assignment,
        _id: undefined,
        deadline: assignment.deadline.toISOString(),
        createdAt: assignment.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Assignment database read failed; using local fallback.", error);
    return NextResponse.json({ assignments: store.getAssignments(subjectId) });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Enforce FACULTY or ADMIN role
    const faculty = await requireRole(["FACULTY", "ADMIN"]);

    const body = await req.json();
    const {
      title,
      description,
      subjectId,
      moduleId,
      totalMarks = 20,
      deadline,
      allowLate = false,
      instructions = [],
    } = body;

    if (!title || !subjectId || !deadline) {
      return NextResponse.json(
        { error: "Title, Subject, and Deadline are required fields." },
        { status: 400 }
      );
    }

    const subject = store.getSubjectById(subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    const modules = store.getModules(subject.id);
    const mod = modules.find((m) => m.id === moduleId) || modules[0] || {
      id: "mod-gen",
      title: "General Module",
    };

    const newAssignment: Assignment = {
      id: `assign-${Date.now()}`,
      title,
      description: description || `Course assignment for ${subject.name}`,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      moduleId: mod.id,
      moduleTitle: mod.title,
      departmentId: subject.departmentId,
      semesterNumber: subject.semesterNumber,
      facultyId: faculty.id,
      facultyName: faculty.name,
      totalMarks: Number(totalMarks),
      deadline: new Date(deadline).toISOString(),
      allowLate: Boolean(allowLate),
      instructions: instructions.length > 0 ? instructions : [
        "Read problem statement carefully before answering.",
        "Plagiarism detection is active. Do not share solution code.",
      ],
      createdAt: new Date().toISOString(),
    };

    await connectToDatabase();
    const saved = await AssignmentModel.create(newAssignment);
    await createAssignmentNotification(newAssignment);
    return NextResponse.json({ success: true, assignment: saved }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to create assignment" }, { status });
  }
}
