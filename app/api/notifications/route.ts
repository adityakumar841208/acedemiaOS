import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getNotificationsForUser, markAllNotificationsRead, markNotificationRead } from "@/lib/services/notification.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const persisted = await getNotificationsForUser(user.id, user.role);
    const notifications = persisted.map((notification) => ({
      id: notification._id.toString(),
      userId: notification.userId,
      targetRole: notification.targetRole,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    }));
    return NextResponse.json({ notifications }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    if (error.status === 401) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    console.error("Notification read failed:", error);
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
      await markAllNotificationsRead(user.id, user.role);
      return NextResponse.json({ success: true });
    }

    if (id) {
      const updated = await markNotificationRead(id, user.id, user.role);
      if (!updated) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
      return NextResponse.json({ success: true, notification: updated });
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Unable to update notification." }, { status: error.status || 500 });
  }
}

