import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

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

