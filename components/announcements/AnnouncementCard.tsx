"use client";

import React from "react";
import { Announcement } from "@/types";
import { Pin, Send, Megaphone, Calendar, ShieldCheck, User } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useUserSession } from "@/context/UserContext";
import { toast } from "sonner";

interface AnnouncementCardProps {
  announcement: Announcement;
  onOpenTelegram?: () => void;
}

export default function AnnouncementCard({
  announcement,
  onOpenTelegram,
}: AnnouncementCardProps) {
  const { isFaculty, isAdmin } = useUserSession();
  const [retrying, setRetrying] = React.useState(false);

  const retryTelegram = async () => {
    try {
      setRetrying(true);
      const response = await fetch(`/api/announcements/${announcement.id}/telegram`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to retry Telegram delivery.");
      toast.success("Telegram notification sent successfully.");
    } catch (error: any) {
      toast.error(error.message || "Unable to retry Telegram delivery.");
    } finally {
      setRetrying(false);
    }
  };
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "URGENT":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "EXAM":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ACADEMIC":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "EVENT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getAuthorRoleBadge = (role: string) => {
    switch (role) {
      case "FACULTY":
        return "bg-amber-500/10 text-amber-700 border-amber-300";
      case "CR":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-300";
      case "ADMIN":
        return "bg-purple-500/10 text-purple-700 border-purple-300";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 transition-all border ${
        announcement.pinned
          ? "bg-gradient-to-r from-amber-50/50 to-orange-50/20 border-amber-200/80 shadow-sm"
          : "bg-white border-slate-200 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadge(
              announcement.category
            )}`}
          >
            {announcement.category}
          </span>

          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${getAuthorRoleBadge(
              announcement.authorRole
            )}`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>{announcement.authorRole}</span>
          </span>

          {announcement.telegramBroadcasted && (
            <span
              title="Delivered to the official Telegram channel"
              className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 flex items-center gap-1"
            >
              <Send className="w-3 h-3 -rotate-12" />
              <span>Telegram delivered</span>
            </span>
          )}

          {announcement.telegram?.status === "FAILED" && (isFaculty || isAdmin) && (
            <button
              onClick={retryTelegram}
              disabled={retrying}
              className="text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 disabled:opacity-50"
            >
              {retrying ? "Retrying..." : "Retry Telegram"}
            </button>
          )}
        </div>

        {announcement.pinned && (
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
            <Pin className="w-3 h-3 rotate-45" />
            <span>Pinned</span>
          </div>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
        {announcement.title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-600 mt-2.5 whitespace-pre-wrap leading-relaxed">
        {announcement.content}
      </p>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>{announcement.authorName}</span>
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatRelativeTime(announcement.createdAt)}</span>
        </span>
      </div>
    </div>
  );
}

