import { Announcement } from "@/types";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

export function formatAnnouncementMessage(announcement: Announcement, announcementUrl?: string) {
  const audience = announcement.departmentId
    ? `${announcement.departmentId}${announcement.semesterNumber !== "ALL" ? ` | Semester ${announcement.semesterNumber}` : ""}`
    : "All Students";
  const published = new Date(announcement.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const safeUrl = announcementUrl && /^https?:\/\//.test(announcementUrl) ? announcementUrl : undefined;

  return [
    "📢 <b>OFFICIAL ANNOUNCEMENT</b>",
    "",
    `<b>${escapeHtml(announcement.title)}</b>`,
    "",
    escapeHtml(announcement.content),
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "🏫 <b>AcademiaOS</b>",
    `🎓 ${escapeHtml(audience)}`,
    `🕒 Published: ${escapeHtml(published)}`,
    safeUrl ? `🔗 <a href=\"${escapeHtml(safeUrl)}\">View Announcement</a>` : "",
  ].filter(Boolean).join("\n");
}

export function formatTestMessage() {
  return [
    "🟢 <b>AcademiaOS Telegram Integration Test</b>",
    "",
    "Telegram notification service is working correctly.",
    "",
    "🏫 AcademiaOS",
  ].join("\n");
}
