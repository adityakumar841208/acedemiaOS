import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import { requireRole } from "@/lib/auth";

const UpdateStudentSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"]).optional(),
  branchId: z.string().optional(),
  semester: z.number().min(1).max(8).optional(),
  rollNumber: z.string().trim().optional(),
  rejectionReason: z.string().max(500).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    await connectToDatabase();
    const student = await User.findOne({ _id: id, role: { $in: ["STUDENT", "CR"] } })
      .populate("branchId", "name code status")
      .lean();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        role: student.role,
        status: student.status,
        department: student.department,
        branchId: student.branchId ? (student.branchId as any)._id?.toString() : undefined,
        branch: student.branchId || null,
        semester: student.semester || 1,
        rollNumber: student.rollNumber || null,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load student" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("ADMIN");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    const body = await req.json();
    const validated = UpdateStudentSchema.safeParse(body);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    await connectToDatabase();
    const targetStudent = await User.findOne({ _id: id, role: { $in: ["STUDENT", "CR"] } });
    if (!targetStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (validated.data.status) {
      updateData.status = validated.data.status;
      if (validated.data.status === "ACTIVE" && targetStudent.status === "PENDING") {
        updateData.approvedBy = new mongoose.Types.ObjectId(admin.id);
        updateData.approvedAt = new Date();
      } else if (validated.data.status === "REJECTED") {
        updateData.rejectedBy = new mongoose.Types.ObjectId(admin.id);
        updateData.rejectedAt = new Date();
        if (validated.data.rejectionReason) {
          updateData.rejectionReason = validated.data.rejectionReason;
        }
      }
    }

    if (validated.data.branchId) {
      if (mongoose.Types.ObjectId.isValid(validated.data.branchId)) {
        updateData.branchId = new mongoose.Types.ObjectId(validated.data.branchId);
        const branchDoc = await Branch.findById(validated.data.branchId).lean();
        if (branchDoc) {
          updateData.department = branchDoc.code;
        }
      }
    }

    if (validated.data.semester !== undefined) {
      updateData.semester = validated.data.semester;
    }

    if (validated.data.rollNumber !== undefined) {
      const trimmedRoll = validated.data.rollNumber.trim();
      if (trimmedRoll) {
        const existingRoll = await User.findOne({
          _id: { $ne: targetStudent._id },
          rollNumber: trimmedRoll,
        });
        if (existingRoll) {
          return NextResponse.json(
            { error: `Roll number '${trimmedRoll}' is already in use by another student.` },
            { status: 409 }
          );
        }
        updateData.rollNumber = trimmedRoll;
      }
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true })
      .populate("branchId", "name code status")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Student record updated successfully.",
      student: {
        id: updated!._id.toString(),
        name: updated!.name,
        email: updated!.email,
        role: updated!.role,
        status: updated!.status,
        department: updated!.department,
        semester: updated!.semester,
        rollNumber: updated!.rollNumber,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update student" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    await connectToDatabase();
    const student = await User.findOne({ _id: id, role: { $in: ["STUDENT", "CR"] } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Student record for ${student.name} deleted.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete student" },
      { status: error.status || 500 }
    );
  }
}
