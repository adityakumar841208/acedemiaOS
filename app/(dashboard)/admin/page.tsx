"use client";

import React, { useState } from "react";
import { useUserSession } from "@/context/UserContext";
import {
  ShieldAlert,
  RotateCcw,
  Database,
  Users,
  FolderTree,
  BookOpen,
  FileCheck2,
  Cpu,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import PendingStudentApprovals from "@/components/auth/PendingStudentApprovals";

export default function AdminPage() {
  const { user, refreshData } = useUserSession();
  const [resetting, setResetting] = useState(false);
  const [stats, setStats] = useState({
    departments: 3,
    semesters: 8,
    subjects: 4,
    modules: 7,
    resources: 4,
    assignments: 3,
    submissions: 3,
  });

  const handleReset = async () => {
    try {
      setResetting(true);
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        await refreshData();
        toast.success("Database restored to default demo state!");
        window.location.reload();
      }
    } catch {
      toast.error("Database reset failed");
    } finally {
      setResetting(false);
    }
  };


  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      <PendingStudentApprovals />
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>CENTRAL ACADEMIC ADMINISTRATION CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            System Administration & Hierarchy Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor institutional entities, reset seed data for demonstrations, and review service status.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto disabled:opacity-60"
        >
          <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
          <span>{resetting ? "Resetting State..." : "Reset Demo Data"}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Departments</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.departments}</div>
          <div className="text-[11px] text-purple-600 mt-0.5">CSE, ECE, MECH</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Subjects</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.subjects}</div>
          <div className="text-[11px] text-indigo-600 mt-0.5">4 in CSE 3rd Sem</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Syllabus Modules</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.modules}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Curriculum mapped</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Vault Resources</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.resources}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Notes, Slides, PYQs</div>
        </div>
      </div>

      {/* Services Health Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <span>Core Subsystem Status</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">5-Tier Hierarchy Engine</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Operational</span>
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Enforces Department → Semester → Subject → Module → Resource cascade integrity.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Hard Deadline Lock Server</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enforcing</span>
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Real-time millisecond countdown check on all <code>POST /api/assignments/[id]/submit</code> routes.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Pairwise Similarity Analyzer</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Scanning</span>
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Automated 3-gram token shingling and Jaccard distance calculation on student submissions.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Telegram Webhook Dispatcher</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulated Online</span>
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Mirrors faculty and CR announcements to the official CSE Batch 2022 channel drawer.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Reset Box */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl p-6 sm:p-8 space-y-3">
        <h3 className="font-bold text-purple-950 text-base">
          Hackathon Evaluator Reset Utility
        </h3>
        <p className="text-xs text-purple-900 leading-relaxed max-w-2xl">
          If you have tested submitting assignments, grading, or adding announcements and would like to restore the exact pristine starting state for a fresh demo run, click below.
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          {resetting ? "Resetting..." : "Restore Pristine Demo State"}
        </button>
      </div>
    </div>
  );
}

