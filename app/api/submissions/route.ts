import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId") || undefined;
  const studentId = searchParams.get("studentId") || undefined;

  const submissions = store.getSubmissions(assignmentId, studentId);
  return NextResponse.json({ submissions });
}

