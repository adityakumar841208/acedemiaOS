"use client";

import React, { useState, useEffect } from "react";
import { useUserSession } from "@/context/UserContext";
import { Announcement, AnnouncementCategory } from "@/types";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import AnnouncementComposer from "@/components/announcements/AnnouncementComposer";
import { Megaphone, Plus } from "lucide-react";

export default function AnnouncementsPage() {
  const { isFaculty, isCR, isAdmin } = useUserSession();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const d = await res.json();
        setAnnouncements(d.announcements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const canPost = isFaculty || isCR || isAdmin;

  const filtered = announcements.filter((a) => {
    if (selectedCategory === "ALL") return true;
    return a.category === selectedCategory;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Megaphone className="w-4 h-4" />
            <span>CAMPUS BULLETINS & NOTICES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Class & Department Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verified academic circulars, exam schedules, and CR alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canPost && (
            <button
              onClick={() => setShowComposer(!showComposer)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{showComposer ? "Hide Composer" : "Post Announcement"}</span>
            </button>
          )}

        </div>
      </div>

      {/* Optional Composer */}
      {showComposer && canPost && (
        <AnnouncementComposer
          onSuccess={() => {
            loadData();
            setShowComposer(false);
          }}
        />
      )}

      {/* Category Pills */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 flex items-center gap-1.5 overflow-x-auto shadow-sm">
        {["ALL", "URGENT", "EXAM", "ACADEMIC", "EVENT", "GENERAL"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              selectedCategory === cat
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No announcements found in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ann) => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
            />
          ))}
        </div>
      )}
    </div>
  );
}

