import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const viewer = await requireAuth();
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId") || undefined;
  const studentId = searchParams.get("studentId") || undefined;

  const requestedStudentId = viewer.role === "FACULTY" || viewer.role === "ADMIN" ? studentId : viewer.id;
  const submissions = store.getSubmissions(assignmentId, requestedStudentId);
  return NextResponse.json({ submissions });
}

