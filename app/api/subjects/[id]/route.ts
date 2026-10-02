import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import SubjectModel from "@/models/Subject";
import AssignmentModel from "@/models/Assignment";
import ResourceModel from "@/models/Resource";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const subject: any = await SubjectModel.findOne({
      $or: [
        { id },
        { code: id },
        { _id: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null },
      ],
    }).lean();

    if (!subject) {
      return NextResponse.json({ error: "Subject not found in database." }, { status: 404 });
    }

    // Load related resources and assignments from database
    const [assignments, resources] = await Promise.all([
      AssignmentModel.find({ subjectId: subject.id }).sort({ deadline: 1 }).lean(),
      ResourceModel ? ResourceModel.find({ subjectId: subject.id }).lean().catch(() => []) : Promise.resolve([]),
    ]);

    const formattedModules = (subject.modules || []).map((m: any, idx: number) => ({
      id: m.id || `mod-${subject.id}-${m.moduleNumber || idx + 1}`,
      subjectId: subject.id,
      moduleNumber: m.moduleNumber || idx + 1,
      title: m.title,
      description: m.description || "",
      topics: m.topics || [],
    }));

    return NextResponse.json({
      success: true,
      subject: {
        ...subject,
        id: subject.id || (subject as any)._id?.toString(),
        branchCode:
          subject.branchCode ||
          subject.departmentId?.replace(/^(dept-|department-)/i, "").toUpperCase(),
        isActive: subject.isActive !== false,
      },
      modules: formattedModules,
      resources: resources || [],
      assignments: assignments || [],
    });
  } catch (err: any) {
    console.error("Error reading subject from DB:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load subject" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to manage syllabus." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "CR") {
      return NextResponse.json(
        {
          error: "Forbidden: Subjects and syllabus can only be modified by Administrators or Class Representatives.",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const subject: any = await SubjectModel.findOne({
      $or: [
        { id },
        { code: id },
        { _id: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null },
      ],
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found in database." }, { status: 404 });
    }

    // If CR, enforce branch and semester match
    if (user.role === "CR") {
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
    }

    const body = await req.json();
    const { name, code, facultyName, description, credits, references, modules, isActive } = body;

    if (name !== undefined) subject.name = name.trim();
    if (code !== undefined) subject.code = code.trim().toUpperCase();
    if (facultyName !== undefined) subject.facultyName = facultyName.trim();
    if (description !== undefined) subject.description = description.trim();
    if (credits !== undefined) subject.credits = Number(credits);
    if (references !== undefined && Array.isArray(references)) subject.references = references;
    if (isActive !== undefined) subject.isActive = Boolean(isActive);

    if (modules !== undefined && Array.isArray(modules)) {
      subject.modules = modules.map((m: any, idx: number) => ({
        id: m.id || `mod-${subject.code.toLowerCase()}-${idx + 1}`,
        moduleNumber: m.moduleNumber || m.order || idx + 1,
        title: m.title || `Module ${idx + 1}`,
        description: m.description || "",
        topics: Array.isArray(m.topics)
          ? m.topics
          : typeof m.topics === "string"
          ? m.topics.split(",").map((t: string) => t.trim()).filter(Boolean)
          : [],
      }));
      subject.modulesCount = subject.modules.length;
    }

    subject.syllabusUpdatedAt = new Date();
    subject.syllabusUpdatedBy = user.name;

    await subject.save();

    return NextResponse.json({
      success: true,
      message: "Subject and curriculum updated in database successfully.",
      subject,
      modules: subject.modules,
    });
  } catch (err: any) {
    console.error("Error updating subject in DB:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update subject." },
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can deactivate or delete subjects." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const subject: any = await SubjectModel.findOne({
      $or: [
        { id },
        { code: id },
        { _id: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null },
      ],
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found in database." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const forceDelete = searchParams.get("force") === "true";

    if (forceDelete) {
      await SubjectModel.deleteOne({ _id: subject._id });
      return NextResponse.json({
        success: true,
        message: `Subject ${subject.code} deleted permanently.`,
      });
    }

    // Default soft deactivation
    subject.isActive = false;
    await subject.save();

    return NextResponse.json({
      success: true,
      message: `Subject ${subject.code} deactivated successfully.`,
      subject,
    });
  } catch (err: any) {
    console.error("Error deleting subject in DB:", err);
    return NextResponse.json(
      { error: err.message || "Failed to deactivate subject." },
      { status: 500 }
    );
  }
}

