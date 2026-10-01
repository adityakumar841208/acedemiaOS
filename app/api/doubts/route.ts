import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth, requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Doubt from "@/models/Doubt";
import User from "@/models/User";
import SubjectModel from "@/models/Subject";
import { createDoubtNotification } from "@/lib/services/notification.service";
import { getDoubtSubjectContext, parseDoubtAttachments } from "@/lib/doubts";
import { normalizeDepartment } from "@/lib/attendance";

function errorResponse(error: any) { return NextResponse.json({ error: error.message || "Doubt request failed." }, { status: error.status || 400 }); }

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    if (searchParams.get("view") === "options") {
      if (user.role !== "STUDENT") return NextResponse.json({ subjects: [], faculty: [] });
      const subjects = await SubjectModel.find({ semesterNumber: user.semester }).select("id code name departmentId semesterNumber facultyId facultyName").lean() as any[];
      const available = subjects.filter((subject) => normalizeDepartment(subject.departmentId) === normalizeDepartment(user.department));
      const assignedFacultyIds = available
        .map((subject) => subject.facultyId)
        .filter((facultyId) => facultyId && mongoose.isValidObjectId(facultyId));
      const assignedFacultyNames = available.map((subject) => subject.facultyName).filter(Boolean);
      const faculty = await User.find({
        role: "FACULTY",
        status: "ACTIVE",
        $or: [
          ...(assignedFacultyIds.length ? [{ _id: { $in: assignedFacultyIds } }] : []),
          ...(assignedFacultyNames.length ? [{ name: { $in: assignedFacultyNames } }] : []),
        ],
      }).select("name email department").lean();
      return NextResponse.json({ subjects: available, faculty: faculty.map((member: any) => ({ id: member._id.toString(), name: member.name, email: member.email })) });
    }
    const query = user.role === "STUDENT" ? { studentId: user.id } : user.role === "FACULTY" ? { facultyId: user.id } : {};
    const doubts = await Doubt.find(query).sort({ updatedAt: -1 }).limit(100).lean();
    const subjectIds = [...new Set(doubts.map((doubt: any) => doubt.subjectId))];
    const subjects = await SubjectModel.find({ id: { $in: subjectIds } }).select("id code name").lean();
    const studentIds = [...new Set(doubts.map((doubt: any) => doubt.studentId))];
    const students = user.role === "FACULTY" || user.role === "ADMIN" ? await User.find({ _id: { $in: studentIds } }).select("name email rollNumber").lean() : [];
    return NextResponse.json({ doubts: doubts.map((doubt: any) => ({ ...doubt, id: doubt._id.toString(), subject: subjects.find((subject: any) => subject.id === doubt.subjectId), student: students.find((student: any) => student._id.toString() === doubt.studentId) })) });
  } catch (error: any) { return errorResponse(error); }
}

export async function POST(req: NextRequest) {
  try {
    const student = await requireRole("STUDENT");
    await connectToDatabase();
    const contentType = req.headers.get("content-type") || "";
    let subjectId = "", facultyId = "", title = "", description = "";
    let attachments: any[] = [];
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      subjectId = String(form.get("subjectId") || ""); facultyId = String(form.get("facultyId") || ""); title = String(form.get("title") || ""); description = String(form.get("description") || ""); attachments = await parseDoubtAttachments(form);
    } else {
      const body = await req.json();
      subjectId = String(body.subjectId || ""); facultyId = String(body.facultyId || ""); title = String(body.title || ""); description = String(body.description || "");
    }
    if (title.trim().length < 3 || description.trim().length < 5) return NextResponse.json({ error: "Add a title and describe your doubt in at least five characters." }, { status: 400 });
    const active = await Doubt.findOne({ studentId: student.id, activeStudentKey: student.id });
    if (active) return NextResponse.json({ error: "You already have an active doubt. Continue that conversation before raising another one.", doubtId: active.id }, { status: 409 });
    const { subject, faculty } = await getDoubtSubjectContext(subjectId, student, facultyId);
    let doubt;
    try {
      doubt = await Doubt.create({ studentId: student.id, facultyId: faculty._id.toString(), subjectId: subject.id, title: title.trim(), description: description.trim(), activeStudentKey: student.id, status: "OPEN", messages: [{ senderId: student.id, senderRole: "student", message: description.trim(), attachments, createdAt: new Date() }] });
    } catch (error: any) {
      if (error.code === 11000) return NextResponse.json({ error: "You already have an active doubt. Open it to continue the conversation." }, { status: 409 });
      throw error;
    }
    await createDoubtNotification({ userId: faculty._id.toString(), title: "New academic doubt", message: `${student.name} raised a doubt in ${subject.name}.`, link: `/faculty/doubts/${doubt.id}` });
    return NextResponse.json({ success: true, doubt }, { status: 201 });
  } catch (error: any) { return errorResponse(error); }
}
