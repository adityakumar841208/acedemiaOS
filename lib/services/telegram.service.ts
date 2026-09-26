import { Announcement, TelegramDelivery } from "@/types";
import { sendMessage } from "@/lib/integrations/telegram/client";
import { formatAnnouncementMessage } from "@/lib/integrations/telegram/messages";
import { TelegramDestination } from "@/lib/integrations/telegram/types";
import { store } from "@/lib/store";

const DEFAULT_DESTINATION_ID = "telegram-default";

export function getTelegramDestination(): TelegramDestination | null {
  const chatId = process.env.TELEGRAM_DEFAULT_CHAT_ID?.trim();
  if (!chatId) return null;
  return {
    id: DEFAULT_DESTINATION_ID,
    name: "Official AcademiaOS Channel",
    chatId,
    enabled: true,
  };
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Telegram delivery failed.";
  return message.replace(/bot[^/\s]+/gi, "bot[redacted]").slice(0, 300);
}

function logDelivery(announcementId: string, destination: TelegramDestination | null, status: string, error?: string, messageId?: number) {
  console.info("[Telegram]", {
    announcement: announcementId,
    destination: destination?.chatId || undefined,
    status,
    ...(messageId ? { messageId } : {}),
    ...(error ? { error } : {}),
  });
}

export async function sendTelegramAnnouncement(announcement: Announcement, announcementUrl?: string) {
  if (!announcement.telegram) {
    announcement.telegram = {
      enabled: true,
      status: "PENDING",
      deliveries: [],
    };
  }
  if (announcement.telegram.status === "SENT") return announcement;

  const destination = getTelegramDestination();
  if (!destination) {
    const telegram = {
      ...announcement.telegram,
      status: "FAILED" as const,
      error: "Telegram destination is not configured.",
      deliveries: [{ destinationId: DEFAULT_DESTINATION_ID, status: "FAILED" as const, error: "Telegram destination is not configured." }],
    };
    store.updateAnnouncementTelegram(announcement.id, telegram);
    logDelivery(announcement.id, null, "FAILED", telegram.error);
    return { ...announcement, telegram };
  }

  try {
    const result = await sendMessage(destination.chatId, formatAnnouncementMessage(announcement, announcementUrl));
    const delivery: TelegramDelivery = {
      destinationId: destination.id,
      status: "SENT",
      messageId: result.messageId,
      chatId: result.chatId,
      sentAt: new Date().toISOString(),
    };
    const telegram = {
      ...announcement.telegram,
      status: "SENT" as const,
      messageId: result.messageId,
      chatId: result.chatId,
      sentAt: delivery.sentAt,
      error: undefined,
      deliveries: [delivery],
    };
    store.updateAnnouncementTelegram(announcement.id, telegram);
    logDelivery(announcement.id, destination, "SUCCESS", undefined, result.messageId);
    return { ...announcement, telegram };
  } catch (error) {
    const message = sanitizeError(error);
    const telegram = {
      ...announcement.telegram,
      status: "FAILED" as const,
      error: message,
      deliveries: [{ destinationId: destination.id, status: "FAILED" as const, chatId: destination.chatId, error: message }],
    };
    store.updateAnnouncementTelegram(announcement.id, telegram);
    logDelivery(announcement.id, destination, "FAILED", message);
    return { ...announcement, telegram };
  }
}

export async function retryTelegramAnnouncement(announcementId: string, announcementUrl?: string) {
  const announcement = store.getAnnouncements().find((item) => item.id === announcementId);
  if (!announcement) throw new Error("Announcement not found.");
  if (!announcement.telegram?.enabled) throw new Error("Telegram delivery is disabled for this announcement.");
  if (announcement.telegram.status === "SENT") return announcement;
  return sendTelegramAnnouncement(announcement, announcementUrl);
}
