import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import Branch from "@/models/Branch";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";

const CreateBranchSchema = z.object({
  name: z.string().trim().min(2, "Branch name must be at least 2 characters").max(100),
  code: z
    .string()
    .trim()
    .min(2, "Branch code must be at least 2 characters")
    .max(12, "Branch code cannot exceed 12 characters")
    .toUpperCase(),
  description: z.string().trim().max(500).optional().default(""),
  hodName: z.string().trim().max(80).optional().default(""),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const statusParam = searchParams.get("status") || "ALL";

    const query: Record<string, any> = {};

    if (statusParam && statusParam !== "ALL") {
      query.status = statusParam;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [{ name: searchRegex }, { code: searchRegex }, { hodName: searchRegex }];
    }

    const branches = await Branch.find(query).sort({ code: 1 }).lean();

    // Compute live counts from MongoDB User collection
    const branchesWithCounts = await Promise.all(
      branches.map(async (b: any) => {
        const branchId = b._id;
        const branchCode = b.code;

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
          id: b._id.toString(),
          name: b.name,
          code: b.code,
          description: b.description || "",
          hodName: b.hodName || "",
          status: b.status || (b.isActive ? "ACTIVE" : "INACTIVE"),
          isActive: b.isActive !== undefined ? b.isActive : b.status === "ACTIVE",
          studentCount: students,
          facultyCount: faculty,
          crCount: crs,
          totalUsers: students + faculty + crs,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      branches: branchesWithCounts,
      total: branchesWithCounts.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load branches" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();

    const validated = CreateBranchSchema.safeParse(body);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, code, description, hodName, status } = validated.data;
    await connectToDatabase();

    const existing = await Branch.findOne({ code });
    if (existing) {
      return NextResponse.json(
        { error: `Branch with code '${code}' already exists.` },
        { status: 409 }
      );
    }

    const newBranch = await Branch.create({
      name,
      code,
      description,
      hodName,
      status,
      isActive: status === "ACTIVE",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Branch ${newBranch.code} created successfully.`,
        branch: {
          id: newBranch._id.toString(),
          name: newBranch.name,
          code: newBranch.code,
          description: newBranch.description,
          hodName: newBranch.hodName,
          status: newBranch.status,
          isActive: newBranch.isActive,
          studentCount: 0,
          facultyCount: 0,
          crCount: 0,
          totalUsers: 0,
          createdAt: newBranch.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create branch" },
      { status: error.status || 500 }
    );
  }
}
