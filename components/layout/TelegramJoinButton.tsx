"use client";

import { Send } from "lucide-react";

const TELEGRAM_GROUP_URL = "https://t.me/gec_madhubani";

export default function TelegramJoinButton() {
  return (
    <a
      href={TELEGRAM_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join the official AcademiaOS Telegram group"
      title="Join official Telegram group"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-sky-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 sm:bottom-5 sm:right-5"
    >
      <Send className="h-4 w-4 -rotate-12" aria-hidden="true" />
      <span>Join Telegram</span>
    </a>
  );
}
