import User from "@/models/User";
import SubjectModel from "@/models/Subject";
import mongoose from "mongoose";
import { normalizeDepartment } from "@/lib/attendance";

const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_SIZE = 8 * 1024 * 1024;

export async function getDoubtSubjectContext(subjectId: string, student: { id: string; department?: string; semester?: number }, facultyId: string) {
  const subject = await SubjectModel.findOne({ id: subjectId }).lean() as any;
  if (!subject) throw new Error("Subject not found.");
  if (student.semester !== subject.semesterNumber || normalizeDepartment(student.department) !== normalizeDepartment(subject.departmentId)) throw new Error("This subject is not available for your class.");
  let faculty = null as any;
  if (subject.facultyId && mongoose.isValidObjectId(subject.facultyId)) faculty = await User.findOne({ _id: subject.facultyId, role: "FACULTY", status: "ACTIVE" }).select("name email department").lean();
  if (!faculty && subject.facultyName) faculty = await User.findOne({ role: "FACULTY", status: "ACTIVE", name: subject.facultyName }).select("name email department").lean();
  if (!faculty || (facultyId && faculty._id.toString() !== facultyId)) throw new Error("That faculty member is not assigned to this subject.");
  return { subject, faculty };
}

export async function getFacultyDoubtSubject(subjectId: string, faculty: { id: string; name: string }) {
  const subject = await SubjectModel.findOne({ id: subjectId }).lean() as any;
  if (!subject) throw new Error("Subject not found.");
  if (subject.facultyId !== faculty.id && subject.facultyName !== faculty.name) throw new Error("You are not assigned to this subject.");
  return subject;
}

export async function parseDoubtAttachments(formData: FormData) {
  const files = formData.getAll("attachments").filter((value): value is File => value instanceof File);
  if (files.length > 3) throw new Error("Attach no more than three files.");
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_ATTACHMENT_SIZE) throw new Error("Attachments must be smaller than 8 MB in total.");
  return Promise.all(files.map(async (file) => {
    if (file.size > MAX_ATTACHMENT_SIZE || !ALLOWED_ATTACHMENT_TYPES.has(file.type)) throw new Error("Attachments must be PDF, image, or document files smaller than 5 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    return { url: `data:${file.type};base64,${bytes.toString("base64")}`, name: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"), mimeType: file.type, size: file.size };
  }));
}
