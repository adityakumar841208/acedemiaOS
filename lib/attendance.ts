import { SubjectModel } from "@/models/Subject";
import User from "@/models/User";

export function normalizeDepartment(value?: string) {
  return (value || "").toLowerCase().replace(/^(dept-|department-)/, "").trim();
}

export function dateKey(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Choose a valid attendance date.");
  return date.toISOString().slice(0, 10);
}

export function assertNotFuture(date: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (date > today) throw new Error("Attendance cannot be recorded for a future date.");
}

export async function getFacultySubject(subjectId: string, facultyId: string, facultyDepartment?: string, facultyName?: string, isAdmin = false) {
  const subject = await SubjectModel.findOne({ id: subjectId }).lean();
  if (!subject) throw new Error("Subject not found.");
  const departmentMatches = normalizeDepartment(subject.departmentId) === normalizeDepartment(facultyDepartment);
  const hasExplicitFaculty = Boolean(subject.facultyId || subject.facultyName);
  const assigned = isAdmin || subject.facultyId === facultyId || subject.facultyName === facultyName || (!hasExplicitFaculty && departmentMatches);
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
