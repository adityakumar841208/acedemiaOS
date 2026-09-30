import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import { hashPassword, requireRole } from "@/lib/auth";

const CreateStudentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Please provide a valid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  branchId: z.string().min(1, "Academic branch is required"),
  semester: z.coerce.number().min(1).max(8).default(1),
  rollNumber: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "REJECTED"]).optional().default("ACTIVE"),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "list"; // "hierarchy" or "list"
    const search = (searchParams.get("search") || "").trim();
    const branchIdParam = searchParams.get("branchId") || "ALL";
    const semesterParam = searchParams.get("semester") || "ALL";
    const statusParam = searchParams.get("status") || "ALL";

    // 1. HIERARCHY VIEW: Branch -> Semester -> Students
    if (view === "hierarchy") {
      const branches = await Branch.find().sort({ code: 1 }).lean();

      const hierarchyData = await Promise.all(
        branches.map(async (branch: any) => {
          const studentQuery: Record<string, any> = {
            role: { $in: ["STUDENT", "CR"] },
            $or: [{ branchId: branch._id }, { department: branch.code }],
          };

          if (statusParam && statusParam !== "ALL") {
            studentQuery.status = statusParam;
          }

          if (search) {
            const searchRegex = { $regex: search, $options: "i" };
            studentQuery.$and = [
              { $or: [{ name: searchRegex }, { email: searchRegex }, { rollNumber: searchRegex }] },
            ];
          }

          const students = await User.find(studentQuery)
            .select("name email rollNumber semester status department createdAt")
            .sort({ semester: 1, rollNumber: 1, name: 1 })
            .lean();

          // Group students by semester
          const semesterMap = new Map<number, any[]>();
          students.forEach((s: any) => {
            const sem = s.semester || 1;
            if (!semesterMap.has(sem)) {
              semesterMap.set(sem, []);
            }
            semesterMap.get(sem)!.push({
              id: s._id.toString(),
              name: s.name,
              email: s.email,
              rollNumber: s.rollNumber || null,
              semester: s.semester,
              status: s.status,
              department: s.department,
              createdAt: s.createdAt,
            });
          });

          // Sort semesters ascending
          const sortedSemesters = Array.from(semesterMap.keys())
            .sort((a, b) => a - b)
            .map((semNum) => ({
              semester: semNum,
              label: `Semester ${semNum}`,
              studentCount: semesterMap.get(semNum)!.length,
              students: semesterMap.get(semNum)!,
            }));

          return {
            branchId: branch._id.toString(),
            branchCode: branch.code,
            branchName: branch.name,
            status: branch.status,
            isActive: branch.isActive,
            totalStudents: students.length,
            semesters: sortedSemesters,
          };
        })
      );

      // Filter out empty branches if user is searching
      const filteredHierarchy = search
        ? hierarchyData.filter((b) => b.totalStudents > 0)
        : hierarchyData;

      return NextResponse.json({
        success: true,
        view: "hierarchy",
        branches: filteredHierarchy,
      });
    }

    // 2. FLAT DIRECTORY / LIST VIEW WITH PAGINATION
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      role: { $in: ["STUDENT", "CR"] },
    };

    if (statusParam && statusParam !== "ALL") {
      filter.status = statusParam;
    }

    if (branchIdParam && branchIdParam !== "ALL") {
      if (mongoose.Types.ObjectId.isValid(branchIdParam)) {
        const bObjId = new mongoose.Types.ObjectId(branchIdParam);
        const bDoc = await Branch.findById(bObjId).lean();
        filter.$or = [
          { branchId: bObjId },
          ...(bDoc ? [{ department: bDoc.code }] : []),
        ];
      } else {
        filter.department = branchIdParam;
      }
    }

    if (semesterParam && semesterParam !== "ALL" && !isNaN(Number(semesterParam))) {
      filter.semester = Number(semesterParam);
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchCond = [
        { name: searchRegex },
        { email: searchRegex },
        { rollNumber: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
    }

    const [
      students,
      totalCount,
      activeCount,
      pendingCount,
      suspendedCount,
      rejectedCount,
      distinctSemesters,
    ] = await Promise.all([
      User.find(filter)
        .populate("branchId", "name code status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
      User.countDocuments({ role: { $in: ["STUDENT", "CR"] }, status: "ACTIVE" }),
      User.countDocuments({ role: { $in: ["STUDENT", "CR"] }, status: "PENDING" }),
      User.countDocuments({ role: { $in: ["STUDENT", "CR"] }, status: "SUSPENDED" }),
      User.countDocuments({ role: { $in: ["STUDENT", "CR"] }, status: "REJECTED" }),
      User.distinct("semester", { role: { $in: ["STUDENT", "CR"] } }),
    ]);

    const formattedStudents = students.map((s: any) => ({
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      role: s.role,
      status: s.status,
      department: s.department,
      branchId: s.branchId?._id?.toString() || s.branchId?.toString(),
      branch: s.branchId || null,
      semester: s.semester || 1,
      rollNumber: s.rollNumber || null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      view: "list",
      students: formattedStudents,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      counts: {
        total: totalCount,
        active: activeCount,
        pending: pendingCount,
        suspended: suspendedCount,
        rejected: rejectedCount,
      },
      availableSemesters: distinctSemesters.filter(Boolean).sort((a: any, b: any) => a - b),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load students" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await req.json();

    const validated = CreateStudentSchema.safeParse(body);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, email, password, branchId, semester, rollNumber, status } = validated.data;

    await connectToDatabase();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return NextResponse.json({ error: "Invalid branch ID format" }, { status: 400 });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return NextResponse.json({ error: "Selected branch does not exist." }, { status: 404 });
    }

    // Generate rollNumber if not provided
    let finalRollNumber = rollNumber?.trim();
    if (!finalRollNumber) {
      const prefix = branch.code;
      let count =
        (await User.countDocuments({
          $or: [{ branchId: branch._id }, { department: prefix }],
        })) + 1;
      finalRollNumber = `${prefix}${count}`;
      while (await User.exists({ rollNumber: finalRollNumber })) {
        count += 1;
        finalRollNumber = `${prefix}${count}`;
      }
    } else {
      const rollExists = await User.findOne({ rollNumber: finalRollNumber });
      if (rollExists) {
        return NextResponse.json(
          { error: `Roll number '${finalRollNumber}' is already in use.` },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    const newStudent = await User.create({
      name,
      email,
      passwordHash,
      role: "STUDENT",
      status: status || "ACTIVE",
      department: branch.code,
      branchId: branch._id,
      semester,
      rollNumber: finalRollNumber,
      approvedBy: admin.id,
      approvedAt: status === "ACTIVE" ? new Date() : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Student account created successfully.",
        student: {
          id: newStudent._id.toString(),
          name: newStudent.name,
          email: newStudent.email,
          role: newStudent.role,
          status: newStudent.status,
          department: newStudent.department,
          semester: newStudent.semester,
          rollNumber: newStudent.rollNumber,
          createdAt: newStudent.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create student account" },
      { status: error.status || 500 }
    );
  }
}
