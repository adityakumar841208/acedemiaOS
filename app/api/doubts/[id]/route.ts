import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Doubt from "@/models/Doubt";
import SubjectModel from "@/models/Subject";
import User from "@/models/User";
import { createDoubtNotification } from "@/lib/services/notification.service";
import { getFacultyDoubtSubject, parseDoubtAttachments } from "@/lib/doubts";

function errorResponse(error: any) { return NextResponse.json({ error: error.message || "Doubt request failed." }, { status: error.status || 400 }); }

async function loadAuthorizedDoubt(id: string, user: any) {
  const doubt = await Doubt.findById(id);
  if (!doubt) throw new Error("Doubt not found.");
  if (user.role === "STUDENT" && doubt.studentId !== user.id) throw new Error("You can only access your own doubts.");
  if (user.role === "FACULTY" && doubt.facultyId !== user.id) throw new Error("You are not assigned to this doubt.");
  return doubt;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(); await connectToDatabase();
    const doubt = await loadAuthorizedDoubt((await params).id, user);
    const [subject, student, faculty] = await Promise.all([
      SubjectModel.findOne({ id: doubt.subjectId }).select("id code name").lean(),
      User.findById(doubt.studentId).select("name email rollNumber").lean(),
      User.findById(doubt.facultyId).select("name email").lean(),
    ]);
    return NextResponse.json({ doubt, subject, student, faculty });
  } catch (error: any) { return errorResponse(error); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(); await connectToDatabase();
    const doubt = await loadAuthorizedDoubt((await params).id, user);
    if (doubt.status === "RESOLVED") return NextResponse.json({ error: "This doubt is resolved and cannot receive more replies." }, { status: 409 });
    const contentType = req.headers.get("content-type") || "";
    let message = "", attachments: any[] = [];
    if (contentType.includes("multipart/form-data")) { const form = await req.formData(); message = String(form.get("message") || ""); attachments = await parseDoubtAttachments(form); }
    else { const body = await req.json(); message = String(body.message || ""); }
    if (message.trim().length < 1 && attachments.length === 0) return NextResponse.json({ error: "Write a reply or attach a file." }, { status: 400 });
    const senderRole = user.role === "FACULTY" ? "faculty" : user.role === "STUDENT" ? "student" : null;
    if (!senderRole) return NextResponse.json({ error: "Only the assigned student or faculty can reply." }, { status: 403 });
    doubt.messages.push({ senderId: user.id, senderRole, message: message.trim(), attachments, createdAt: new Date() } as any);
    doubt.status = "IN_PROGRESS";
    await doubt.save();
    const recipient = senderRole === "student" ? doubt.facultyId : doubt.studentId;
    await createDoubtNotification({ userId: recipient, title: senderRole === "student" ? "Student replied to a doubt" : "Faculty replied to your doubt", message: message.trim().slice(0, 140) || "A file was attached.", link: senderRole === "student" ? `/faculty/doubts/${doubt.id}` : `/doubts/${doubt.id}` });
    return NextResponse.json({ success: true, doubt });
  } catch (error: any) { return errorResponse(error); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(); await connectToDatabase();
    const doubt = await loadAuthorizedDoubt((await params).id, user);
    const action = String((await req.json()).action || "");
    if (action === "resolve") {
      if (user.role !== "FACULTY") return NextResponse.json({ error: "Only assigned faculty can resolve a doubt." }, { status: 403 });
      await getFacultyDoubtSubject(doubt.subjectId, user);
      if (doubt.status === "RESOLVED") return NextResponse.json({ error: "Doubt is already resolved." }, { status: 409 });
      doubt.status = "RESOLVED"; doubt.activeStudentKey = undefined; doubt.resolvedAt = new Date(); doubt.resolvedBy = user.id;
      await doubt.save();
      await createDoubtNotification({ userId: doubt.studentId, title: "Doubt resolved", message: "Your faculty resolved your academic doubt.", link: `/doubts/${doubt.id}` });
      return NextResponse.json({ success: true, doubt });
    }
    if (action === "reopen") {
      if (user.role !== "STUDENT" || doubt.studentId !== user.id) return NextResponse.json({ error: "Only the student can reopen this doubt." }, { status: 403 });
      const active = await Doubt.findOne({ studentId: user.id, activeStudentKey: user.id, _id: { $ne: doubt.id } });
      if (active) return NextResponse.json({ error: "You already have another active doubt." }, { status: 409 });
      doubt.status = "IN_PROGRESS"; doubt.activeStudentKey = user.id; doubt.resolvedAt = undefined; doubt.resolvedBy = undefined; await doubt.save();
      return NextResponse.json({ success: true, doubt });
    }
    return NextResponse.json({ error: "Unknown doubt action." }, { status: 400 });
  } catch (error: any) { return errorResponse(error); }
}
