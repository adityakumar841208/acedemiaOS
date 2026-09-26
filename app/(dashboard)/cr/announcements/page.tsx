"use client";

import React, { useState, useEffect } from "react";
import { useUserSession } from "@/context/UserContext";
import { Announcement } from "@/types";
import AnnouncementComposer from "@/components/announcements/AnnouncementComposer";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import { Radio, Users, Megaphone, BellRing } from "lucide-react";

export default function CRAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);

  const loadAnnouncements = async () => {
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
    loadAnnouncements();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
            <Radio className="w-4 h-4" />
            <span>CLASS REPRESENTATIVE BROADCAST HUB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Class Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish official notices to the student portal and connected college channels.
          </p>
        </div>

        <button
          onClick={() => setShowComposer(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto"
        >
          <Megaphone className="w-4 h-4" />
          <span>Create Announcement</span>
        </button>
      </div>

      {/* CR Stats Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Target Audience</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">CSE Batch 2022-26</div>
            <div className="text-[11px] text-emerald-600">74 Enrolled Students</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Total Broadcasts</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{announcements.length}</div>
            <div className="text-[11px] text-indigo-600">Synced Across Portal</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Announcement Composer */}
      {showComposer && <AnnouncementComposer onSuccess={loadAnnouncements} onClose={() => setShowComposer(false)} />}

      {/* Existing Announcements Feed */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-emerald-600" />
          <span>Broadcast Log & Feed</span>
        </h3>

        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No announcements broadcasted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <AnnouncementCard
                key={ann.id}
                announcement={ann}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

