import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import { requireRole } from "@/lib/auth";

const UpdateFacultySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING", "REJECTED"]).optional(),
  branchIds: z.array(z.string().min(1)).min(1, "At least one branch must remain assigned").optional(),
  facultyProfile: z
    .object({
      designation: z.string().trim().max(100).optional(),
      title: z.string().trim().max(100).optional(),
      officeLocation: z.string().trim().max(100).optional(),
      phone: z.string().trim().max(25).optional(),
      bio: z.string().trim().max(1000).optional(),
    })
    .optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid faculty ID" }, { status: 400 });
    }

    await connectToDatabase();
    const faculty = await User.findOne({ _id: id, role: "FACULTY" })
      .populate("branchIds", "name code status")
      .populate("branchId", "name code status")
      .lean();

    if (!faculty) {
      return NextResponse.json({ error: "Faculty member not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      faculty: {
        id: faculty._id.toString(),
        name: faculty.name,
        email: faculty.email,
        role: faculty.role,
        status: faculty.status,
        department: faculty.department,
        branchIds: Array.isArray(faculty.branchIds)
          ? faculty.branchIds.map((b: any) => (b && b._id ? b._id.toString() : b.toString()))
          : [],
        branches: Array.isArray(faculty.branchIds) ? faculty.branchIds : [],
        facultyProfile: faculty.facultyProfile,
        createdAt: faculty.createdAt,
        updatedAt: faculty.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load faculty details" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid faculty ID" }, { status: 400 });
    }

    const body = await req.json();
    const validated = UpdateFacultySchema.safeParse(body);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await User.findOne({ _id: id, role: "FACULTY" });
    if (!existing) {
      return NextResponse.json({ error: "Faculty member not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (validated.data.name !== undefined) {
      updateData.name = validated.data.name.trim();
    }

    if (validated.data.status !== undefined) {
      updateData.status = validated.data.status;
    }

    if (validated.data.branchIds !== undefined) {
      const validBranchObjIds: mongoose.Types.ObjectId[] = [];
      for (const bId of validated.data.branchIds) {
        if (!mongoose.Types.ObjectId.isValid(bId)) {
          return NextResponse.json({ error: `Invalid branch ID format: ${bId}` }, { status: 400 });
        }
        validBranchObjIds.push(new mongoose.Types.ObjectId(bId));
      }

      const foundBranches = await Branch.find({ _id: { $in: validBranchObjIds } }).lean();
      if (foundBranches.length !== validBranchObjIds.length) {
        return NextResponse.json(
          { error: "One or more selected branches do not exist in the database." },
          { status: 400 }
        );
      }

      updateData.branchIds = validBranchObjIds;
      updateData.branchId = validBranchObjIds[0];
      if (foundBranches[0]) {
        updateData.department = foundBranches[0].code;
      }
    }

    if (validated.data.facultyProfile !== undefined) {
      updateData.facultyProfile = {
        ...(existing.facultyProfile || {}),
        ...validated.data.facultyProfile,
      };
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true })
      .populate("branchIds", "name code status")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Faculty profile updated successfully.",
      faculty: {
        id: updated!._id.toString(),
        name: updated!.name,
        email: updated!.email,
        role: updated!.role,
        status: updated!.status,
        department: updated!.department,
        branches: Array.isArray(updated!.branchIds) ? updated!.branchIds : [],
        facultyProfile: updated!.facultyProfile,
        updatedAt: updated!.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update faculty member" },
      { status: error.status || 500 }
    );
  }
}
