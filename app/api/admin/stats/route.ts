import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole("ADMIN");
    await connectToDatabase();

    // 1. Role-wise user statistics from MongoDB
    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalCRs,
      totalAdmins,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      rejectedUsers,
      pendingStudents,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "FACULTY" }),
      User.countDocuments({ role: "CR" }),
      User.countDocuments({ role: "ADMIN" }),
      User.countDocuments({ status: "ACTIVE" }),
      User.countDocuments({ status: "PENDING" }),
      User.countDocuments({ status: "SUSPENDED" }),
      User.countDocuments({ status: "REJECTED" }),
      User.countDocuments({ role: "STUDENT", status: "PENDING" }),
    ]);

    // 2. Branch statistics from MongoDB
    const [totalBranches, activeBranches, inactiveBranches, allBranches] = await Promise.all([
      Branch.countDocuments(),
      Branch.countDocuments({ $or: [{ status: "ACTIVE" }, { isActive: true }] }),
      Branch.countDocuments({ $and: [{ status: "INACTIVE" }, { isActive: { $ne: true } }] }),
      Branch.find().sort({ code: 1 }).lean(),
    ]);

    // 3. Branch-wise distribution derived dynamically from MongoDB
    const branchDistribution = await Promise.all(
      allBranches.map(async (branch: any) => {
        const branchId = branch._id;
        const branchCode = branch.code;

        const [students, faculty, crs] = await Promise.all([
          User.countDocuments({
            role: "STUDENT",
            $or: [{ branchId }, { department: branchCode }],
          }),
          User.countDocuments({
            role: "FACULTY",
            $or: [{ branchIds: branchId }, { branchId }, { department: branchCode }],
          }),
          User.countDocuments({
            role: "CR",
            $or: [{ branchId }, { department: branchCode }],
          }),
        ]);

        return {
          id: branch._id.toString(),
          name: branch.name,
          code: branch.code,
          status: branch.status || (branch.isActive ? "ACTIVE" : "INACTIVE"),
          isActive: branch.isActive !== undefined ? branch.isActive : branch.status === "ACTIVE",
          hodName: branch.hodName || "Not assigned",
          students,
          faculty,
          crs,
          total: students + faculty + crs,
        };
      })
    );

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          totalUsers,
          totalStudents,
          totalFaculty,
          totalCRs,
          totalAdmins,
          activeUsers,
          pendingUsers,
          pendingStudents,
          suspendedUsers,
          rejectedUsers,
        },
        branches: {
          totalBranches,
          activeBranches,
          inactiveBranches,
        },
        distribution: branchDistribution,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard statistics" },
      { status: error.status || 500 }
    );
  }
}
