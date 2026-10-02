import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import SubjectModel from "@/models/Subject";
import FacultySubject from "@/models/FacultySubject";
import Branch from "@/models/Branch";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const branchParam = searchParams.get("branchIds") || searchParams.get("branches") || "";
    const currentFacultyId = searchParams.get("facultyId") || "";

    const branchList = branchParam
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);

    // Resolve branch codes and departmentIds
    const branchCodes: string[] = [];
    const deptIds: string[] = [];

    if (branchList.length > 0) {
      // Look up branches by ID or code
      const validObjIds = branchList.filter((b) => mongoose.Types.ObjectId.isValid(b));
      const textCodes = branchList.filter((b) => !mongoose.Types.ObjectId.isValid(b));

      const foundBranches = await Branch.find({
        $or: [
          { _id: { $in: validObjIds } },
          { code: { $in: textCodes.map((c) => c.toUpperCase()) } },
        ],
      }).lean();

      foundBranches.forEach((b: any) => {
        branchCodes.push(b.code.toUpperCase());
        deptIds.push(`dept-${b.code.toLowerCase()}`);
      });

      // Include textCodes directly as uppercase
      textCodes.forEach((c) => {
        const upper = c.toUpperCase();
        if (!branchCodes.includes(upper)) branchCodes.push(upper);
        const dept = `dept-${c.toLowerCase()}`;
        if (!deptIds.includes(dept)) deptIds.push(dept);
      });
    }

    // Query subjects for the specified branches (or all active subjects if no branch specified)
    const subjectQuery: Record<string, any> = { isActive: { $ne: false } };
    if (branchCodes.length > 0) {
      subjectQuery.$or = [
        { branchCode: { $in: branchCodes } },
        { departmentId: { $in: deptIds } },
      ];
    }

    const [subjects, activeAllocations] = await Promise.all([
      SubjectModel.find(subjectQuery).sort({ semesterNumber: 1, code: 1 }).lean(),
      FacultySubject.find({ status: "ACTIVE" }).lean(),
    ]);

    // Map active allocations by subjectId
    const allocationMap = new Map<string, any>();
    activeAllocations.forEach((alloc: any) => {
      allocationMap.set(alloc.subjectId, alloc);
    });

    const enrichedSubjects = subjects.map((sub: any) => {
      const subId = sub.id || sub._id.toString();
      const branchCode =
        sub.branchCode || sub.departmentId?.replace(/^(dept-|department-)/i, "").toUpperCase();

      const activeAlloc = allocationMap.get(subId);

      let isAssignedToOther = false;
      let isAssignedToCurrent = false;
      let assignedToFacultyName = "";
      let assignedToFacultyId = "";

      if (activeAlloc) {
        const isCurrent =
          currentFacultyId &&
          (activeAlloc.facultyId === currentFacultyId ||
            activeAlloc.facultyId === currentFacultyId.toString());

        if (isCurrent) {
          isAssignedToCurrent = true;
          assignedToFacultyName = activeAlloc.facultyName;
          assignedToFacultyId = activeAlloc.facultyId;
        } else {
          isAssignedToOther = true;
          assignedToFacultyName = activeAlloc.facultyName;
          assignedToFacultyId = activeAlloc.facultyId;
        }
      }

      return {
        id: subId,
        code: sub.code,
        name: sub.name,
        branchCode,
        departmentId: sub.departmentId,
        semesterNumber: sub.semesterNumber,
        credits: sub.credits || 4,
        isAssignedToOther,
        isAssignedToCurrent,
        isFree: !activeAlloc,
        assignedToFacultyName: activeAlloc ? activeAlloc.facultyName : null,
        assignedToFacultyId: activeAlloc ? activeAlloc.facultyId : null,
      };
    });

    return NextResponse.json({
      success: true,
      subjects: enrichedSubjects,
    });
  } catch (err: any) {
    console.error("Error fetching subject availability:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load available subjects" },
      { status: 500 }
    );
  }
}

