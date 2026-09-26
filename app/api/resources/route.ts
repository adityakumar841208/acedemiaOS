import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Resource } from "@/types";
import { requireAuth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import ResourceModel from "@/models/Resource";
import { createResourceNotification } from "@/lib/services/notification.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("dept") || undefined;
  const semesterNumber = searchParams.get("sem") ? Number(searchParams.get("sem")) : undefined;
  const subjectId = searchParams.get("subject") || undefined;
  const moduleId = searchParams.get("module") || undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (departmentId && departmentId !== "ALL") query.departmentId = departmentId;
    if (semesterNumber) query.semesterNumber = semesterNumber;
    if (subjectId && subjectId !== "ALL") query.subjectId = subjectId;
    if (moduleId && moduleId !== "ALL") query.moduleId = moduleId;
    if (category && category !== "ALL") query.category = category;
    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { subjectName: { $regex: escaped, $options: "i" } },
        { moduleTitle: { $regex: escaped, $options: "i" } },
      ];
    }
    const resources = await ResourceModel.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      resources: resources.map((resource) => ({
        ...resource,
        _id: undefined,
        createdAt: resource.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Resource database read failed; using local fallback.", error);
    return NextResponse.json({ resources: store.getResources({ departmentId, semesterNumber, subjectId, moduleId, category, search }) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const {
      title,
      description,
      subjectId,
      moduleId,
      category,
      fileType = "pdf",
      fileSize = "2.4 MB",
      contentSnippet = "",
    } = body;

    if (!title || !subjectId) {
      return NextResponse.json({ error: "Title and Subject are required." }, { status: 400 });
    }

    const subject = store.getSubjectById(subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Selected subject not found." }, { status: 404 });
    }

    const modules = store.getModules(subject.id);
    const mod = modules.find((m) => m.id === moduleId) || modules[0] || {
      id: "mod-generic",
      moduleNumber: 1,
      title: "General Module",
    };

    const newResource: Resource = {
      id: `res-${Date.now()}`,
      title,
      description: description || `Study resource for ${subject.name}`,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      moduleId: mod.id,
      moduleNumber: mod.moduleNumber,
      moduleTitle: mod.title,
      departmentId: subject.departmentId,
      semesterNumber: subject.semesterNumber,
      category: category || "NOTES",
      fileUrl: `/docs/${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`,
      fileSize,
      fileType: (fileType as "pdf" | "pptx" | "mp4" | "doc") || "pdf",
      uploadedBy: {
        id: user.id,
        name: user.name,
        role: user.role.toLowerCase() as any,
      },
      createdAt: new Date().toISOString(),
      downloadCount: 0,
      isVerified: user.role === "FACULTY" || user.role === "CR",
      contentSnippet: contentSnippet || `# ${title}\n\nUploaded notes and study guide for ${subject.name}.`,
    };

    await connectToDatabase();
    const saved = await ResourceModel.create(newResource);
    await createResourceNotification(newResource);
    return NextResponse.json({ success: true, resource: saved }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to create resource" }, { status });
  }
}
