import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import SubjectModel from "@/models/Subject";
import Branch from "@/models/Branch";
import { ensureSyllabusSubjectsInDB } from "@/lib/syllabus-catalog";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const currentUser = await getCurrentUser();

    // Ensure database catalog has records populated
    const count = await SubjectModel.countDocuments();
    if (count === 0) {
      await ensureSyllabusSubjectsInDB();
    }

    const { searchParams } = new URL(req.url);
    const deptId = searchParams.get("deptId") || searchParams.get("branchCode") || undefined;
    const semParam = searchParams.get("sem") || searchParams.get("semesterNumber") || undefined;
    const semNumber = semParam ? Number(semParam) : undefined;
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "ALL";

    const query: Record<string, any> = {};

    const normalizeDepartment = (value: string) =>
      value.replace(/^(dept-|department-)/i, "").trim().toLowerCase();
    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (
      currentUser &&
      (currentUser.role === "STUDENT" || currentUser.role === "CR")
    ) {
      const department = normalizeDepartment(currentUser.department || "");
      const semester = Number(currentUser.semester);

      query.$and = [
        { semesterNumber: Number.isInteger(semester) ? semester : -1 },
        {
          $or: [
            { departmentId: new RegExp(`^(dept-|department-)?${escapeRegex(department)}$`, "i") },
            { branchCode: new RegExp(`^${escapeRegex(department)}$`, "i") },
          ],
        },
      ];
      query.isActive = { $ne: false };
    }

    // Filter by branch/department if specified
    if (!currentUser || (currentUser.role !== "STUDENT" && currentUser.role !== "CR")) {
      if (deptId && deptId !== "ALL") {
      const norm = deptId.replace(/^(dept-|department-)/i, "").toUpperCase();
      query.$or = [
        { departmentId: deptId },
        { departmentId: `dept-${norm.toLowerCase()}` },
        { departmentId: norm },
        { branchCode: norm },
      ];
      }

      // Filter by semester if specified
      if (semNumber !== undefined && !isNaN(semNumber) && semNumber > 0) {
        query.semesterNumber = semNumber;
      }
    }

    // Filter by active status
    if (status === "ACTIVE") {
      query.isActive = { $ne: false };
    } else if (status === "INACTIVE") {
      query.isActive = false;
    }

    // Filter by search
    if (search) {
      const regex = new RegExp(search, "i");
      const searchCond = [{ name: regex }, { code: regex }, { description: regex }];
      if (query.$and) {
        query.$and.push({ $or: searchCond });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCond }];
        delete query.$or;
      } else {
        query.$or = searchCond;
      }
    }

    // Query database
    const [dbSubjects, dbBranches] = await Promise.all([
      SubjectModel.find(query).sort({ semesterNumber: 1, code: 1 }).lean(),
      Branch.find({ $or: [{ status: "ACTIVE" }, { isActive: true }] }).sort({ code: 1 }).lean(),
    ]);

    // Format departments from database branches
    const departments = dbBranches.map((b: any) => ({
      id: `dept-${b.code.toLowerCase()}`,
      name: b.name,
      code: b.code,
      branchId: b._id.toString(),
    }));

    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

    // Extract all modules from the database subjects
    const allModules: any[] = [];
    const subjects = dbSubjects.map((s: any) => {
      const subId = s.id || s._id.toString();
      const branchCode =
        s.branchCode || s.departmentId?.replace(/^(dept-|department-)/i, "").toUpperCase();

      if (Array.isArray(s.modules)) {
        s.modules.forEach((m: any, idx: number) => {
          allModules.push({
            id: m.id || `mod-${subId}-${m.moduleNumber || idx + 1}`,
            subjectId: subId,
            moduleNumber: m.moduleNumber || idx + 1,
            title: m.title,
            description: m.description || "",
            topics: Array.isArray(m.topics) ? m.topics : [],
          });
        });
      }

      return {
        ...s,
        id: subId,
        _id: s._id ? s._id.toString() : subId,
        branchCode,
        isActive: s.isActive !== false,
      };
    });
    const uniqueSubjects = Array.from(
      new Map(
        subjects.map((subject: any) => [
          `${subject.departmentId}-${subject.semesterNumber}-${String(subject.code).toLowerCase()}`,
          subject,
        ])
      ).values()
    );

    return NextResponse.json({
      success: true,
      departments,
      semesters,
      subjects: uniqueSubjects,
      modules: allModules,
    });
  } catch (err: any) {
    console.error("Database read error in /api/subjects:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load subjects from database." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    // Role Check: ADMIN or CR may create subjects in database
    if (user.role !== "ADMIN" && user.role !== "CR") {
      return NextResponse.json(
        {
          error: "Forbidden: Subjects and curriculum can only be created by Administrators or Class Representatives.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      code,
      name,
      branchCode: inputBranchCode,
      departmentId: inputDeptId,
      semesterNumber: inputSem,
      credits = 4,
      description = "",
      modules = [],
      references = [],
    } = body;

    if (!code || typeof code !== "string" || code.trim().length < 2) {
      return NextResponse.json(
        { error: "Subject code is required (min 2 characters)." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Subject name is required (min 2 characters)." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let branchCode = inputBranchCode;
    let semesterNumber = Number(inputSem);

    if (user.role === "CR") {
      branchCode = user.department?.replace(/^(dept-|department-)/i, "").toUpperCase();
      semesterNumber = user.semester || 3;
    } else {
      if (!branchCode && inputDeptId) {
        branchCode = inputDeptId.replace(/^(dept-|department-)/i, "").toUpperCase();
      }
    }

    if (!branchCode) {
      return NextResponse.json(
        { error: "Branch/Department code is required." },
        { status: 400 }
      );
    }

    if (isNaN(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
      return NextResponse.json(
        { error: "Semester must be a number between 1 and 8." },
        { status: 400 }
      );
    }

    const normCode = code.trim().toUpperCase();
    const departmentId = `dept-${branchCode.toLowerCase()}`;

    // Check for duplicate subject in same branch and semester
    const existing = await SubjectModel.findOne({
      code: normCode,
      $or: [{ departmentId }, { branchCode }],
      semesterNumber,
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Subject code ${normCode} already exists in ${branchCode} Semester ${semesterNumber}.`,
        },
        { status: 409 }
      );
    }

    const id = `sub-${branchCode.toLowerCase()}-${normCode.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    const formattedModules = (Array.isArray(modules) ? modules : []).map((m: any, idx: number) => ({
      id: m.id || `mod-${normCode.toLowerCase()}-${idx + 1}`,
      moduleNumber: m.moduleNumber || idx + 1,
      title: m.title || `Module ${idx + 1}`,
      description: m.description || "",
      topics: Array.isArray(m.topics)
        ? m.topics
        : typeof m.topics === "string"
        ? m.topics.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
    }));

    const newSubject = await SubjectModel.create({
      id,
      code: normCode,
      name: name.trim(),
      departmentId,
      branchCode,
      semesterNumber,
      facultyId: "",
      facultyName: "",
      credits: Number(credits) || 4,
      color: "from-indigo-600 to-blue-600",
      description: description.trim(),
      modulesCount: formattedModules.length,
      references: Array.isArray(references) ? references : [],
      modules: formattedModules,
      isActive: true,
      syllabusUpdatedAt: new Date(),
      syllabusUpdatedBy: user.name,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Subject successfully created in database.",
        subject: newSubject,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating subject in DB:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create subject." },
      { status: 500 }
    );
  }
}

