import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get("deptId") || undefined;
  const semNumber = searchParams.get("sem") ? Number(searchParams.get("sem")) : undefined;

  const departments = store.getDepartments();
  const semesters = store.getSemesters();
  const subjects = store.getSubjects(deptId, semNumber);
  const modules = store.getModules();

  return NextResponse.json({
    departments,
    semesters,
    subjects,
    modules,
  });
}

