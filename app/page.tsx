"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  FolderTree,
  Lock,
  Sparkles,
  KeyRound,
  UserPlus,
  LogIn,
} from "lucide-react";
import PublicFooter from "@/components/layout/PublicFooter";
import { HexagonPattern } from "@/components/ui/hexagon-pattern"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none -z-10" />

      {/* Landing Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Academia<span className="text-indigo-400">OS</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              Register Account
            </Link>
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 text-center">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            maskImage:
              "radial-gradient(ellipse 75% 65% at center, black 20%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 65% at center, black 20%, transparent 100%)",
          }}
        >
          <HexagonPattern className="absolute inset-0 h-full w-full opacity-20" />
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Production-Grade Full-Stack LMS • Real RBAC & Session Auth</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight sm:leading-none">
          The Unified LMS Organized By{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-amber-300">
            Academic Hierarchy
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          From <strong>Department → Semester → Subject → Module → Resource</strong>.
          Protected by server-side role authentication, HTTP-only JWT sessions, hard deadline locks, and real-time plagiarism detection.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Portal</span>
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Register as Student</span>
          </Link>
        </div>

        {/* Real Accounts Guide for Evaluators */}
        <div className="mt-12 max-w-3xl mx-auto p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-sm text-left">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Evaluator Demo Accounts (Database Pre-Seeded):</span>
            </span>
            <Link
              href="/login"
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              Go to Login →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/login"
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500 transition-all block group"
            >
              <div className="text-lg mb-1">🎓</div>
              <div className="font-semibold text-xs text-white group-hover:text-indigo-300">
                Aditya (Student)
              </div>
              <div className="text-[10px] text-slate-400 truncate">aditya.student@campus.edu</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">StudentPass123!</div>
            </Link>

            <Link
              href="/login"
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500 transition-all block group"
            >
              <div className="text-lg mb-1">📢</div>
              <div className="font-semibold text-xs text-white group-hover:text-emerald-300">
                Priya (CR)
              </div>
              <div className="text-[10px] text-slate-400 truncate">priya.cr@campus.edu</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">CrPass123!</div>
            </Link>

            <Link
              href="/login"
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500 transition-all block group"
            >
              <div className="text-lg mb-1">👨‍🏫</div>
              <div className="font-semibold text-xs text-white group-hover:text-amber-300">
                Prof. Sharma
              </div>
              <div className="text-[10px] text-slate-400 truncate">sharma.faculty@campus.edu</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">FacultyPass123!</div>
            </Link>

            <Link
              href="/login"
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500 transition-all block group"
            >
              <div className="text-lg mb-1">🛡️</div>
              <div className="font-semibold text-xs text-white group-hover:text-purple-300">
                Dr. Mehra (Admin)
              </div>
              <div className="text-[10px] text-slate-400 truncate">admin@campus.edu</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">AdminPass123!</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Core Architecture Highlights
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-100">
            Built for Real College Workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <FolderTree className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">5-Tier Academic Hierarchy</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              No more messy Google Drive folders. All materials strictly structured under:
              Department → Semester → Subject → Module → Resource categories.
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Server-Enforced Deadline Lock</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Assignments lock at the exact millisecond of deadline. Client form disables and the API rejects late submissions with HTTP 403.
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Pairwise Token Similarity</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Detects copied code and assignments in real-time. Highlights exact matching sentence fragments in a side-by-side plagiarism inspector.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
