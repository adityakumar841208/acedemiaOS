import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import SubjectModel from "@/models/Subject";
import FacultySubject from "@/models/FacultySubject";
import { ensureSyllabusSubjectsInDB, CANONICAL_SYLLABUS_SUBJECTS } from "@/lib/syllabus-catalog";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const semesterNumber = searchParams.get("semesterNumber")
      ? Number(searchParams.get("semesterNumber"))
      : undefined;
    const status = searchParams.get("status") || undefined;

    const query: any = {};
    if (facultyId) query.facultyId = facultyId;
    if (departmentId) query.departmentId = departmentId;
    if (semesterNumber) query.semesterNumber = semesterNumber;
    if (status && status !== "ALL") query.status = status;

    const facultySubjects = await FacultySubject.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      facultySubjects,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch faculty subject assignments." },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN");
    await connectToDatabase();
    await ensureSyllabusSubjectsInDB();

    const body = await req.json();
    const { facultyId, subjectId, departmentId, semesterNumber } = body;

    // Basic payload presence
    if (!facultyId || !subjectId || !departmentId || semesterNumber === undefined) {
      return NextResponse.json(
        { error: "Faculty ID, Subject ID, Department/Branch, and Semester are required." },
        { status: 400 }
      );
    }

    const semNum = Number(semesterNumber);
    // 4. Validate Semester range (1 - 8)
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      return NextResponse.json(
        { error: "Semester must be a valid number between 1 and 8." },
        { status: 400 }
      );
    }

    // 1 & 2. Verify Faculty exists and has role 'FACULTY'
    const faculty = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(facultyId) ? new mongoose.Types.ObjectId(facultyId) : null },
        { id: facultyId },
      ],
    }).lean();

    if (!faculty) {
      return NextResponse.json(
        { error: "Faculty member not found." },
        { status: 404 }
      );
    }

    if (faculty.role !== "FACULTY") {
      return NextResponse.json(
        { error: `User ${faculty.name} does not hold the FACULTY role.` },
        { status: 400 }
      );
    }

    // 3. Verify Department / Branch
    const normDept = departmentId.replace(/^(dept-|department-)/i, "").toUpperCase();
    const branchExists = await Branch.findOne({
      $or: [
        { code: normDept },
        { name: new RegExp(`^${normDept}$`, "i") },
      ],
    }).lean();

    if (!branchExists) {
      return NextResponse.json({ error: `Branch ${normDept} does not exist.` }, { status: 404 });
    }

    const facultyBranchIds = [
      ...(Array.isArray((faculty as any).branchIds) ? (faculty as any).branchIds : []),
      (faculty as any).branchId,
    ].filter(Boolean).map((branchId: any) => branchId.toString());
    if (!facultyBranchIds.includes(branchExists._id.toString())) {
      return NextResponse.json(
        { error: `${faculty.name} is not affiliated with the ${normDept} branch.` },
        { status: 400 }
      );
    }

    // 5. Verify Subject exists
    let subject = await SubjectModel.findOne({ id: subjectId }).lean();
    if (!subject) {
      const canonical = CANONICAL_SYLLABUS_SUBJECTS.find((s) => s.id === subjectId);
      if (canonical) {
        subject = canonical as any;
      }
    }

    if (!subject) {
      return NextResponse.json(
        { error: "Subject does not exist in the curriculum." },
        { status: 404 }
      );
    }

    // 6. Verify Subject belongs to that department/branch
    const subjectDept = subject.departmentId.replace(/^(dept-|department-)/i, "").toUpperCase();
    if (subjectDept !== normDept) {
      return NextResponse.json(
        {
          error: `Validation Error: Subject ${subject.code} (${subject.name}) belongs to department ${subjectDept}, not ${normDept}.`,
        },
        { status: 400 }
      );
    }

    // 7 & 8. Verify Subject belongs to that semester and exists in that semester's syllabus
    if (Number(subject.semesterNumber) !== semNum) {
      return NextResponse.json(
        {
          error: `Validation Error: Subject ${subject.code} (${subject.name}) belongs to Semester ${subject.semesterNumber} syllabus, not Semester ${semNum}.`,
        },
        { status: 400 }
      );
    }

    // Normalized department ID e.g. "dept-cse"
    const standardDeptId = `dept-${normDept.toLowerCase()}`;
    const facultyIdentifier = faculty._id ? faculty._id.toString() : (faculty as any).id;

    // A subject can have only one active faculty owner at a time.
    const existingSubjectAssignment = await FacultySubject.findOne({
      subjectId: subject.id,
      status: "ACTIVE",
    });

    if (existingSubjectAssignment) {
      return NextResponse.json(
        { error: `${subject.code} is already assigned to ${existingSubjectAssignment.facultyName}. Edit that faculty member first to release it.` },
        { status: 409 }
      );
    }

    const assignmentId = `fsub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    try {
      const newAssignment = await FacultySubject.create({
        id: assignmentId,
        facultyId: facultyIdentifier,
        facultyName: faculty.name,
        facultyEmail: faculty.email,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        departmentId: standardDeptId,
        branchCode: normDept,
        semesterNumber: semNum,
        status: "ACTIVE",
        assignedBy: admin.name || "Super Admin",
        assignedAt: new Date(),
      });

      return NextResponse.json(
        {
          success: true,
          message: `Successfully assigned ${subject.name} to ${faculty.name}.`,
          facultySubject: newAssignment,
        },
        { status: 201 }
      );
    } catch (dbErr: any) {
      if (dbErr.code === 11000 || dbErr.message?.includes("E11000")) {
        return NextResponse.json(
          { error: `Duplicate Assignment: An active assignment for ${faculty.name} on ${subject.name} already exists.` },
          { status: 409 }
        );
      }
      throw dbErr;
    }
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to assign subject to faculty." },
      { status }
    );
  }
}
