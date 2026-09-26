import { TelegramApiResponse, TelegramMessageResult } from "./types";

const TELEGRAM_API_TIMEOUT_MS = 20000;

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram bot is not configured.");
  return token;
}

async function callTelegram<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TELEGRAM_API_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.telegram.org/bot${getBotToken()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const data = (await response.json()) as TelegramApiResponse<T>;
    if (!response.ok || !data.ok || !data.result) {
      const error = new Error(
        `Telegram API error (${data.error_code || response.status}): ${data.description || "Request failed"}`
      );
      (error as Error & { telegramStatus?: number; retryAfter?: number }).telegramStatus =
        data.error_code || response.status;
      (error as Error & { telegramStatus?: number; retryAfter?: number }).retryAfter =
        data.parameters?.retry_after;
      throw error;
    }
    return data.result;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Telegram request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendMessage(chatId: string, text: string): Promise<TelegramMessageResult> {
  const result = await callTelegram<{ message_id: number; chat: { id: number | string } }>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
  return { messageId: result.message_id, chatId: String(result.chat.id) };
}

export async function getMe() {
  return callTelegram<{ username?: string; first_name?: string }>("getMe", {});
}

export async function getChat(chatId: string) {
  return callTelegram<{ id: number | string; title?: string; username?: string }>("getChat", { chat_id: chatId });
}
