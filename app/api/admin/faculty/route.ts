import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import { hashPassword, requireRole } from "@/lib/auth";
import FacultySubject from "@/models/FacultySubject";
import { syncFacultySubjects } from "@/lib/faculty-subject-assignments";

const CreateFacultySchema = z.object({
  name: z.string().trim().min(2, "Full Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Please provide a valid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  branchIds: z.array(z.string().min(1)).min(1, "Please assign at least one department/branch"),
  subjectIds: z.array(z.string().min(1)).default([]),
  designation: z.string().trim().max(100).optional().default("Assistant Professor"),
  title: z.string().trim().max(100).optional().default(""),
  officeLocation: z.string().trim().max(100).optional().default(""),
  phone: z.string().trim().max(25).optional().default(""),
  bio: z.string().trim().max(1000).optional().default(""),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional().default("ACTIVE"),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { role: "FACULTY" };

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      const objId = new mongoose.Types.ObjectId(branchId);
      query.$or = [{ branchIds: objId }, { branchId: objId }];
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [{ name: searchRegex }, { email: searchRegex }] },
        ];
        delete query.$or;
      } else {
        query.$or = [{ name: searchRegex }, { email: searchRegex }];
      }
    }

    const [facultyList, totalCount] = await Promise.all([
      User.find(query)
        .populate("branchIds", "name code status isActive")
        .populate("branchId", "name code status isActive")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const activeSubjectAssignments = await FacultySubject.find({
      facultyId: { $in: facultyList.map((faculty: any) => faculty._id.toString()) },
      status: "ACTIVE",
    }).lean();
    const assignmentsByFaculty = new Map<string, any[]>();
    activeSubjectAssignments.forEach((assignment: any) => {
      const list = assignmentsByFaculty.get(assignment.facultyId) || [];
      list.push(assignment);
      assignmentsByFaculty.set(assignment.facultyId, list);
    });

    const formatted = facultyList.map((f: any) => {
      const branchMap = new Map<string, any>();
      if (Array.isArray(f.branchIds)) {
        f.branchIds.forEach((b: any) => {
          if (b && b._id) {
            branchMap.set(b._id.toString(), {
              id: b._id.toString(),
              name: b.name,
              code: b.code,
              status: b.status,
            });
          }
        });
      }
      if (f.branchId && f.branchId._id) {
        branchMap.set(f.branchId._id.toString(), {
          id: f.branchId._id.toString(),
          name: f.branchId.name,
          code: f.branchId.code,
          status: f.branchId.status,
        });
      }

      const assignedSubjects = assignmentsByFaculty.get(f._id.toString()) || [];
      return {
        id: f._id.toString(),
        name: f.name,
        email: f.email,
        role: f.role,
        status: f.status,
        department: f.department,
        branches: Array.from(branchMap.values()),
        assignedSubjectIds: assignedSubjects.map((subject) => subject.subjectId),
        assignedSubjects: assignedSubjects.map((subject) => ({
          id: subject.id,
          subjectId: subject.subjectId,
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          branchCode: subject.branchCode,
          semesterNumber: subject.semesterNumber,
        })),
        assignedSubjectsCount: assignedSubjects.length,
        facultyProfile: f.facultyProfile || {
          designation: "Assistant Professor",
          officeLocation: "",
          phone: "",
          bio: "",
        },
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      faculty: formatted,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load faculty" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();

    const validated = CreateFacultySchema.safeParse(body);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      name,
      email,
      password,
      branchIds,
      subjectIds,
      designation,
      title,
      officeLocation,
      phone,
      bio,
      status,
    } = validated.data;

    await connectToDatabase();

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Validate that branchIds are valid ObjectIds
    const validBranchObjIds: mongoose.Types.ObjectId[] = [];
    for (const idStr of branchIds) {
      if (!mongoose.Types.ObjectId.isValid(idStr)) {
        return NextResponse.json(
          { error: `Invalid branch ID format: ${idStr}` },
          { status: 400 }
        );
      }
      validBranchObjIds.push(new mongoose.Types.ObjectId(idStr));
    }

    // Verify branches exist in DB
    const foundBranches = await Branch.find({ _id: { $in: validBranchObjIds } }).lean();
    if (foundBranches.length !== validBranchObjIds.length) {
      return NextResponse.json(
        { error: "One or more selected branches do not exist in the database." },
        { status: 400 }
      );
    }

    const primaryBranch = foundBranches[0];
    const passwordHash = await hashPassword(password);

    // Create faculty without semester or rollNumber
    const newFaculty = await User.create({
      name,
      email,
      passwordHash,
      role: "FACULTY",
      status: status || "ACTIVE",
      department: primaryBranch ? primaryBranch.code : "CSE",
      branchId: primaryBranch ? primaryBranch._id : undefined,
      branchIds: validBranchObjIds,
      facultyProfile: {
        designation,
        title: title || designation,
        officeLocation,
        phone,
        bio,
      },
    });

    try {
      await syncFacultySubjects({
        facultyId: newFaculty._id.toString(),
        facultyName: newFaculty.name,
        facultyEmail: newFaculty.email,
        branchIds,
        subjectIds,
        assignedBy: "Super Admin",
      });
    } catch (error) {
      await User.deleteOne({ _id: newFaculty._id });
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Faculty account created successfully.",
        faculty: {
          id: newFaculty._id.toString(),
          name: newFaculty.name,
          email: newFaculty.email,
          role: newFaculty.role,
          status: newFaculty.status,
          department: newFaculty.department,
          branches: foundBranches.map((b: any) => ({
            id: b._id.toString(),
            name: b.name,
            code: b.code,
          })),
          facultyProfile: newFaculty.facultyProfile,
          createdAt: newFaculty.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create faculty account" },
      { status: error.status || 500 }
    );
  }
}
