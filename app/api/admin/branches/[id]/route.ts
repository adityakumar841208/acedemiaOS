import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Branch from "@/models/Branch";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";

const UpdateBranchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(12)
    .toUpperCase()
    .optional(),
  description: z.string().trim().max(500).optional(),
  hodName: z.string().trim().max(80).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid branch ID" }, { status: 400 });
    }

    await connectToDatabase();
    const branch = await Branch.findById(id).lean();
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const [students, faculty, crs] = await Promise.all([
      User.countDocuments({
        role: "STUDENT",
        $or: [{ branchId: branch._id }, { department: branch.code }],
      }),
      User.countDocuments({
        role: "FACULTY",
        $or: [{ branchIds: branch._id }, { branchId: branch._id }, { department: branch.code }],
      }),
      User.countDocuments({
        role: "CR",
        $or: [{ branchId: branch._id }, { department: branch.code }],
      }),
    ]);

    return NextResponse.json({
      success: true,
      branch: {
        id: branch._id.toString(),
        name: branch.name,
        code: branch.code,
        description: branch.description,
        hodName: branch.hodName,
        status: branch.status,
        isActive: branch.isActive,
        studentCount: students,
        facultyCount: faculty,
        crCount: crs,
        totalUsers: students + faculty + crs,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load branch" },
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
      return NextResponse.json({ error: "Invalid branch ID" }, { status: 400 });
    }

    const body = await req.json();
    const validated = UpdateBranchSchema.safeParse(body);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    await connectToDatabase();
    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const { name, code, description, hodName, status, isActive } = validated.data;

    if (code && code !== branch.code) {
      const existing = await Branch.findOne({ code, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { error: `Branch code '${code}' is already in use.` },
          { status: 409 }
        );
      }
      branch.code = code;
    }

    if (name !== undefined) branch.name = name;
    if (description !== undefined) branch.description = description;
    if (hodName !== undefined) branch.hodName = hodName;

    if (status !== undefined) {
      branch.status = status;
      branch.isActive = status === "ACTIVE";
    } else if (isActive !== undefined) {
      branch.isActive = isActive;
      branch.status = isActive ? "ACTIVE" : "INACTIVE";
    }

    await branch.save();

    return NextResponse.json({
      success: true,
      message: `Branch ${branch.code} updated successfully.`,
      branch: {
        id: branch._id.toString(),
        name: branch.name,
        code: branch.code,
        description: branch.description,
        hodName: branch.hodName,
        status: branch.status,
        isActive: branch.isActive,
        updatedAt: branch.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update branch" },
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
      return NextResponse.json({ error: "Invalid branch ID" }, { status: 400 });
    }

    await connectToDatabase();
    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Safety check: Prevent deletion if users are associated with this branch
    const associatedUsers = await User.countDocuments({
      $or: [
        { branchId: branch._id },
        { branchIds: branch._id },
        { department: branch.code },
      ],
    });

    if (associatedUsers > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete branch '${branch.code}' because ${associatedUsers} user account(s) are affiliated with it. Consider deactivating the branch instead to preserve academic integrity.`,
          associatedUsers,
        },
        { status: 409 }
      );
    }

    await Branch.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Branch ${branch.code} deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete branch" },
      { status: error.status || 500 }
    );
  }
}
