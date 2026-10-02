import mongoose from "mongoose";
import Branch from "@/models/Branch";
import FacultySubject from "@/models/FacultySubject";
import SubjectModel from "@/models/Subject";

export async function syncFacultySubjects({
  facultyId,
  facultyName,
  facultyEmail,
  branchIds,
  subjectIds,
  assignedBy,
}: {
  facultyId: string;
  facultyName: string;
  facultyEmail: string;
  branchIds: string[];
  subjectIds: string[];
  assignedBy: string;
}) {
  const branchObjectIds = branchIds.map((id) => new mongoose.Types.ObjectId(id));
  const branches = await Branch.find({ _id: { $in: branchObjectIds } }).lean();
  const branchCodes = new Set(branches.map((branch: any) => branch.code.toUpperCase()));
  const selectedIds = Array.from(new Set(subjectIds));
  const subjects = selectedIds.length
    ? await SubjectModel.find({ id: { $in: selectedIds }, isActive: { $ne: false } }).lean()
    : [];

  if (subjects.length !== selectedIds.length) {
    throw Object.assign(new Error("One or more selected subjects do not exist."), { status: 400 });
  }

  for (const subject of subjects as any[]) {
    const subjectBranch = (subject.branchCode || subject.departmentId || "")
      .replace(/^(dept-|department-)/i, "")
      .toUpperCase();
    if (!branchCodes.has(subjectBranch)) {
      throw Object.assign(new Error(`${subject.code} is outside the faculty's selected branches.`), { status: 400 });
    }
  }

  for (const subject of subjects as any[]) {
    const existing = await FacultySubject.findOne({ subjectId: subject.id, status: "ACTIVE" });
    if (existing && existing.facultyId !== facultyId) {
      throw Object.assign(new Error(`${subject.code} is already assigned to ${existing.facultyName}. Edit that faculty member first to release it.`), { status: 409 });
    }
  }

  const activeAssignments = await FacultySubject.find({ facultyId, status: "ACTIVE" });
  const selectedSet = new Set(selectedIds);
  for (const assignment of activeAssignments) {
    if (!selectedSet.has(assignment.subjectId)) {
      assignment.status = "REVOKED";
      assignment.revokedBy = assignedBy;
      assignment.revokedAt = new Date();
      assignment.revocationReason = "Removed during faculty profile update";
      await assignment.save();
    }
  }

  for (const subject of subjects as any[]) {
    const existing = await FacultySubject.findOne({ subjectId: subject.id, status: "ACTIVE" });
    if (existing) continue;
    const branchCode = (subject.branchCode || subject.departmentId || "")
      .replace(/^(dept-|department-)/i, "")
      .toUpperCase();
    const departmentId = `dept-${branchCode.toLowerCase()}`;

    await FacultySubject.create({
      id: `fsub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      facultyId,
      facultyName,
      facultyEmail,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      departmentId,
      branchCode,
      semesterNumber: subject.semesterNumber,
      status: "ACTIVE",
      assignedBy,
      assignedAt: new Date(),
    });
  }
}
