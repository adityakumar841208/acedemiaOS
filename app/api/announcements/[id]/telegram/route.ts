import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { retryTelegramAnnouncement } from "@/lib/services/telegram.service";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["FACULTY", "ADMIN"]);
    const { id } = await context.params;
    const announcement = await retryTelegramAnnouncement(id, new URL("/announcements", req.url).toString());
    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    return NextResponse.json({ error: "Unable to retry Telegram delivery." }, { status: error.status || 500 });
  }
}