import { SubjectModel } from "@/models/Subject";
import User from "@/models/User";
import FacultySubject from "@/models/FacultySubject";

export function normalizeDepartment(value?: string) {
  return (value || "").toLowerCase().replace(/^(dept-|department-)/, "").trim();
}

export function dateKey(value: string | Date) {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const [year, month, day] = normalized.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) return normalized;
    }
    throw new Error("Choose a valid attendance date in YYYY-MM-DD format.");
  }
  if (Number.isNaN(value.getTime())) throw new Error("Choose a valid attendance date.");
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

export function assertNotFuture(date: string) {
  const now = new Date();
  const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  if (date > today) throw new Error("Attendance cannot be recorded for a future date.");
}

export function dateValue(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

export async function getFacultySubject(subjectId: string, facultyId: string, facultyDepartment?: string, facultyName?: string, isAdmin = false) {
  const subject = await SubjectModel.findOne({ id: subjectId }).lean();
  if (!subject) throw new Error("Subject not found.");
  const assigned = isAdmin || Boolean(await FacultySubject.exists({
    facultyId,
    subjectId,
    status: "ACTIVE",
  }));
  if (!assigned) throw new Error("You are not authorized to manage attendance for this subject.");
  return subject;
}

export async function getEnrolledStudents(subject: { departmentId: string; semesterNumber: number }) {
  const department = normalizeDepartment(subject.departmentId);
  const students = await User.find({
    role: { $in: ["STUDENT", "CR"] },
    status: "ACTIVE",
    semester: subject.semesterNumber,
    $or: [
      { department: new RegExp(`^${department}$`, "i") },
      { department: new RegExp(`^dept-${department}$`, "i") },
    ],
  }).select("name rollNumber department semester branchId").sort({ rollNumber: 1, name: 1 }).lean();
  return students.map((student: any) => ({
    id: student._id.toString(),
    name: student.name,
    rollNumber: student.rollNumber || "Unassigned",
    department: student.department,
    semester: student.semester,
  }));
}

export function normalizeAttendance(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["present", "p"].includes(normalized)) return "present" as const;
  if (["absent", "a"].includes(normalized)) return "absent" as const;
  throw new Error(`Invalid attendance value: ${String(value)}`);
}
