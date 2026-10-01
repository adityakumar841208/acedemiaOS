import connectToDatabase from "@/lib/db";
import Notification, { NotificationType } from "@/models/Notification";
import { Announcement, Assignment, Resource } from "@/types";

async function createNotification(input: {
  title: string;
  message: string;
  type: NotificationType;
  link: string;
  targetRole?: string;
  userId?: string;
}) {
  await connectToDatabase();
  return Notification.create({ ...input, isRead: false });
}

export async function createAnnouncementNotification(announcement: Announcement) {
  try {
    await createNotification({
      targetRole: "STUDENT",
      title: `Announcement: ${announcement.title}`,
      message: `${announcement.authorName} (${announcement.authorRole}) posted an update.`,
      type: "announcement" as NotificationType,
      link: "/announcements",
    });
  } catch (error) {
    console.error("[Notifications] Failed to persist announcement notification", {
      error: error instanceof Error ? error.message : "unknown error",
    });
  }
}

export async function createAssignmentNotification(assignment: Assignment) {
  try {
    await createNotification({
      targetRole: "STUDENT",
      title: `Assignment Posted: ${assignment.title}`,
      message: `Due on ${new Date(assignment.deadline).toLocaleDateString()}`,
      type: "assignment",
      link: `/assignments/${assignment.id}`,
    });
  } catch (error) {
    console.error("[Notifications] Failed to persist assignment notification", error);
  }
}

export async function createResourceNotification(resource: Resource) {
  try {
    await createNotification({
      targetRole: "STUDENT",
      title: `New Resource: ${resource.title}`,
      message: `${resource.uploadedBy.name} uploaded ${resource.category} for ${resource.subjectCode}`,
      type: "resource",
      link: "/resources",
    });
  } catch (error) {
    console.error("[Notifications] Failed to persist resource notification", error);
  }
}

export async function createGradeNotification(input: {
  userId: string;
  marks: number;
  maxMarks: number;
  feedback: string;
  assignmentId: string;
}) {
  try {
    return await createNotification({
      userId: input.userId,
      title: `Assignment Graded: ${input.marks}/${input.maxMarks}`,
      message: `Your submission was evaluated with feedback: "${input.feedback.slice(0, 100)}"`,
      type: "grade",
      link: `/assignments/${input.assignmentId}`,
    });
  } catch (error) {
    console.error("[Notifications] Failed to persist grade notification", error);
    return null;
  }
}

export async function createDoubtNotification(input: { userId: string; title: string; message: string; link: string }) {
  try {
    return await createNotification({ userId: input.userId, title: input.title, message: input.message, type: "doubt", link: input.link });
  } catch (error) {
    console.error("[Notifications] Failed to persist doubt notification", error);
    return null;
  }
}

export async function getNotificationsForUser(userId: string, role: string) {
  await connectToDatabase();
  return Notification.find({
    $or: [
      { userId },
      { targetRole: role },
      { targetRole: role.toUpperCase() },
      { targetRole: "ALL" },
    ],
  }).sort({ createdAt: -1 }).limit(100).lean();
}

export async function markNotificationRead(id: string, userId: string, role: string) {
  await connectToDatabase();
  return Notification.findOneAndUpdate(
    {
      _id: id,
      $or: [{ userId }, { targetRole: role }, { targetRole: role.toUpperCase() }, { targetRole: "ALL" }],
    },
    { isRead: true },
    { new: true }
  ).lean();
}

export async function markAllNotificationsRead(userId: string, role: string) {
  await connectToDatabase();
  return Notification.updateMany(
    { $or: [{ userId }, { targetRole: role }, { targetRole: role.toUpperCase() }, { targetRole: "ALL" }] },
    { isRead: true }
  );
}
