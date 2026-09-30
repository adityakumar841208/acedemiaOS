import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import { requireRole } from "@/lib/auth";

const UpdateUserSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"]).optional(),
  role: z.enum(["STUDENT", "CR", "FACULTY", "ADMIN"]).optional(),
  branchId: z.string().optional(),
  branchIds: z.array(z.string()).optional(),
  semester: z.number().min(1).max(8).optional().nullable(),
  rollNumber: z.string().trim().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role") || "ALL";
    const statusParam = searchParams.get("status") || "ALL";
    const branchParam = searchParams.get("branchId") || "";
    const semesterParam = searchParams.get("semester");
    const searchParam = (searchParams.get("search") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (roleParam && roleParam !== "ALL") {
      filter.role = roleParam.toUpperCase();
    }

    if (statusParam && statusParam !== "ALL") {
      filter.status = statusParam.toUpperCase();
    }

    if (branchParam && branchParam !== "ALL") {
      if (mongoose.Types.ObjectId.isValid(branchParam)) {
        const bObjId = new mongoose.Types.ObjectId(branchParam);
        const branchDoc = await Branch.findById(bObjId).lean();
        const branchCode = branchDoc?.code;
        filter.$or = [
          { branchId: bObjId },
          { branchIds: bObjId },
          ...(branchCode ? [{ department: branchCode }] : []),
        ];
      } else {
        filter.department = branchParam;
      }
    }

    if (semesterParam && !isNaN(Number(semesterParam))) {
      filter.semester = Number(semesterParam);
    }

    if (searchParam) {
      const searchRegex = { $regex: searchParam, $options: "i" };
      const searchConditions = [
        { name: searchRegex },
        { email: searchRegex },
        { rollNumber: searchRegex },
        { department: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const [
      totalUsers,
      totalStudents,
      totalCRs,
      totalFaculty,
      totalAdmins,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      rejectedUsers,
      filteredTotal,
      usersList,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "CR" }),
      User.countDocuments({ role: "FACULTY" }),
      User.countDocuments({ role: "ADMIN" }),
      User.countDocuments({ status: "ACTIVE" }),
      User.countDocuments({ status: "PENDING" }),
      User.countDocuments({ status: "SUSPENDED" }),
      User.countDocuments({ status: "REJECTED" }),
      User.countDocuments(filter),
      User.find(filter)
        .populate("branchId", "name code status")
        .populate("branchIds", "name code status")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const formattedUsers = usersList.map((u: any) => {
      const branches: Array<{ id: string; name: string; code: string }> = [];
      if (u.branchId && typeof u.branchId === "object" && u.branchId._id) {
        branches.push({
          id: u.branchId._id.toString(),
          name: u.branchId.name,
          code: u.branchId.code,
        });
      }
      if (Array.isArray(u.branchIds)) {
        u.branchIds.forEach((b: any) => {
          if (b && typeof b === "object" && b._id) {
            const bIdStr = b._id.toString();
            if (!branches.some((existing) => existing.id === bIdStr)) {
              branches.push({ id: bIdStr, name: b.name, code: b.code });
            }
          }
        });
      }

      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        department: u.department,
        branchId: u.branchId?._id?.toString() || u.branchId?.toString(),
        branch: branches[0] || null,
        branches,
        semester: u.semester,
        rollNumber: u.rollNumber || null,
        facultyProfile: u.facultyProfile,
        approvedAt: u.approvedAt,
        rejectedAt: u.rejectedAt,
        rejectionReason: u.rejectionReason,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      counts: {
        all: totalUsers,
        students: totalStudents,
        crs: totalCRs,
        faculty: totalFaculty,
        admins: totalAdmins,
        active: activeUsers,
        pending: pendingUsers,
        suspended: suspendedUsers,
        rejected: rejectedUsers,
      },
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit) || 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await req.json();

    const validated = UpdateUserSchema.safeParse(body);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { userId, status, role, branchId, branchIds, semester, rollNumber } = validated.data;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    await connectToDatabase();
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser._id.toString() === admin.id) {
      if (status && status !== "ACTIVE") {
        return NextResponse.json(
          { error: "You cannot suspend or deactivate your own administrative account." },
          { status: 400 }
        );
      }
      if (role && role !== "ADMIN") {
        return NextResponse.json(
          { error: "You cannot revoke your own administrative privileges." },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, any> = {};

    if (status) {
      updateData.status = status;
      if (status === "ACTIVE" && targetUser.status === "PENDING") {
        updateData.approvedBy = new mongoose.Types.ObjectId(admin.id);
        updateData.approvedAt = new Date();
      } else if (status === "REJECTED") {
        updateData.rejectedBy = new mongoose.Types.ObjectId(admin.id);
        updateData.rejectedAt = new Date();
      }
    }

    if (role) {
      updateData.role = role;
    }

    if (branchId) {
      if (mongoose.Types.ObjectId.isValid(branchId)) {
        updateData.branchId = new mongoose.Types.ObjectId(branchId);
        const branchDoc = await Branch.findById(branchId).lean();
        if (branchDoc) {
          updateData.department = branchDoc.code;
        }
      }
    }

    if (branchIds && Array.isArray(branchIds)) {
      updateData.branchIds = branchIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (updateData.branchIds.length > 0 && !updateData.branchId) {
        updateData.branchId = updateData.branchIds[0];
      }
    }

    if (semester !== undefined) {
      updateData.semester = semester === null ? undefined : semester;
    }

    if (rollNumber !== undefined) {
      if (rollNumber && rollNumber.trim()) {
        const trimmedRoll = rollNumber.trim();
        const existingRoll = await User.findOne({
          _id: { $ne: targetUser._id },
          rollNumber: trimmedRoll,
        });
        if (existingRoll) {
          return NextResponse.json(
            { error: `Roll number '${trimmedRoll}' is already in use by another user.` },
            { status: 409 }
          );
        }
        updateData.rollNumber = trimmedRoll;
      } else {
        updateData.rollNumber = undefined;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
      .populate("branchId", "name code status")
      .populate("branchIds", "name code status")
      .lean();

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      user: {
        id: updatedUser!._id.toString(),
        name: updatedUser!.name,
        email: updatedUser!.email,
        role: updatedUser!.role,
        status: updatedUser!.status,
        department: updatedUser!.department,
        semester: updatedUser!.semester,
        rollNumber: updatedUser!.rollNumber,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: error.status || 500 }
    );
  }
}
