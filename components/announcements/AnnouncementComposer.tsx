"use client";

import React, { useState } from "react";
import { useUserSession } from "@/context/UserContext";
import { AnnouncementCategory } from "@/types";
import { Megaphone, Send, Pin, X } from "lucide-react";
import { toast } from "sonner";

interface AnnouncementComposerProps {
  onSuccess: () => void;
  onClose?: () => void;
}

export default function AnnouncementComposer({ onSuccess, onClose }: AnnouncementComposerProps) {
  const { user, currentRole, refreshData } = useUserSession();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("GENERAL");
  const [pinned, setPinned] = useState(false);
  const [department, setDepartment] = useState("ALL");
  const [semester, setSemester] = useState<number | "ALL">("ALL");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and message content cannot be empty.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          pinned,
          departmentId: department,
          semesterNumber: semester,
          audience: department === "ALL" ? "ALL_STUDENTS" : semester === "ALL" ? "DEPARTMENT" : "SEMESTER",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish announcement");

      toast.success(data.message || "Announcement published successfully!");
      setTitle("");
      setContent("");
      setDepartment("ALL");
      setSemester("ALL");
      await refreshData();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to broadcast");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Broadcast Class Announcement
            </h3>
            <p className="text-xs text-slate-500">
              Publishing as <strong>{user?.name || "Author"}</strong> ({currentRole.toUpperCase()})
            </p>
          </div>
        </div>

        {onClose && (
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close announcement form">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Announcement Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Schedule for CS301 Lab Quiz & Record Submission"
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="ALL">All departments</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="ECE">Electronics (ECE)</option>
              <option value="MECH">Mechanical (MECH)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value === "ALL" ? "ALL" : Number(e.target.value))} className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="ALL">All semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <option key={item} value={item}>Semester {item}</option>)}
            </select>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Broadcast Content / Message *
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Details, venue, links, deadlines, or instructions..."
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
        </div>

        {/* Categories & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Category selection */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["URGENT", "EXAM", "ACADEMIC", "EVENT", "GENERAL"] as AnnouncementCategory[]).map(
              (cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-semibold border transition-colors ${
                    category === cat
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Announcement controls */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <Pin className="w-3.5 h-3.5 text-amber-600" />
              <span>Pin to top</span>
            </label>

            <span className="text-xs text-sky-700">Published to the student portal and official Telegram channel</span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Broadcasting..." : "Broadcast Announcement"}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

