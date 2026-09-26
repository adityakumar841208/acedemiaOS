import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import connectToDatabase from "@/lib/db";
import Assignment from "@/models/Assignment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let assignment = store.getAssignmentById(id);
  try {
    await connectToDatabase();
    const databaseAssignment = await Assignment.findOne({ id }).lean();
    if (databaseAssignment) {
      const normalizedAssignment = {
        ...databaseAssignment,
        deadline: databaseAssignment.deadline.toISOString(),
        createdAt: databaseAssignment.createdAt.toISOString(),
      } as any;
      assignment = normalizedAssignment;
      store.ensureAssignment(normalizedAssignment);
    }
  } catch (error) {
    console.error("Assignment database detail read failed; using local fallback.", error);
  }
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const submissions = store.getSubmissions(id);

  return NextResponse.json({
    assignment,
    submissionsCount: submissions.length,
    submissions,
  });
}

