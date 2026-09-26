import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Announcement } from "@/types";
import { requireRole } from "@/lib/auth";
import { sendTelegramAnnouncement } from "@/lib/services/telegram.service";
import { z } from "zod";
import { createAnnouncementNotification } from "@/lib/services/notification.service";

const AnnouncementInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(5000),
  category: z.enum(["URGENT", "EXAM", "ACADEMIC", "EVENT", "GENERAL"]).default("GENERAL"),
  departmentId: z.enum(["ALL", "CSE", "ECE", "MECH"]).default("ALL"),
  semesterNumber: z.union([z.literal("ALL"), z.coerce.number().int().min(1).max(8)]).default("ALL"),
  pinned: z.boolean().default(false),
  audience: z.enum(["ALL_STUDENTS", "DEPARTMENT", "SEMESTER", "BATCH", "SPECIFIC_GROUP"]).default("ALL_STUDENTS"),
});

export async function GET() {
  const announcements = store.getAnnouncements();
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  try {
    const author = await requireRole(["CR", "FACULTY", "ADMIN"]);

    const parsed = AnnouncementInputSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid announcement." }, { status: 400 });
    const { title, content, category, departmentId, semesterNumber, pinned, audience } = parsed.data;

    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      category,
      departmentId,
      semesterNumber,
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role as any,
      pinned: Boolean(pinned),
      createdAt: new Date().toISOString(),
      telegramBroadcasted: false,
      audience,
    };

    const saved = store.createAnnouncement(newAnnouncement);
    await createAnnouncementNotification(saved);
    const published = await sendTelegramAnnouncement(saved, new URL(`/announcements`, req.url).toString());
    const message = published.telegram?.status === "FAILED"
      ? "Announcement published successfully. Telegram notification could not be delivered."
      : "Announcement published successfully.";
    return NextResponse.json({ success: true, message, announcement: published }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to post announcement" }, { status });
  }
}
