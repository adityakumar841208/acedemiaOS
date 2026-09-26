"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserSession } from "@/context/UserContext";
import {
  LayoutDashboard,
  BookOpen,
  FolderArchive,
  FileCheck2,
  Megaphone,
  PlusCircle,
  Award,
  Radio,
  ShieldAlert,
  User,
  LogOut,
  Building,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role, isStudent, isFaculty, isCR, isAdmin, logout } = useUserSession();

  // Navigation configured strictly by user's real database role
  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "System Admin", href: "/admin", icon: ShieldAlert },
        { name: "Subjects Directory", href: "/subjects", icon: BookOpen },
        { name: "Resource Vault", href: "/resources", icon: FolderArchive },
        { name: "Announcements", href: "/announcements", icon: Megaphone },
        { name: "My Profile", href: "/profile", icon: User },
      ];
    }

    if (isFaculty) {
      return [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Assignment Studio", href: "/faculty/assignments", icon: PlusCircle },
        { name: "Grade Submissions", href: "/faculty/submissions/assign-01", icon: Award },
        { name: "Resource Vault", href: "/resources", icon: FolderArchive },
        { name: "Announcements", href: "/announcements", icon: Megaphone },
        { name: "My Profile", href: "/profile", icon: User },
      ];
    }

    if (isCR) {
      return [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Class Broadcasts", href: "/cr/announcements", icon: Radio },
        { name: "Subjects & Syllabus", href: "/subjects", icon: BookOpen },
        { name: "Resource Vault", href: "/resources", icon: FolderArchive },
        { name: "Assignments", href: "/assignments", icon: FileCheck2 },
        { name: "Announcements", href: "/announcements", icon: Megaphone },
        { name: "My Profile", href: "/profile", icon: User },
      ];
    }

    // Default: STUDENT
    return [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Subjects & Syllabus", href: "/subjects", icon: BookOpen },
      { name: "Resource Vault", href: "/resources", icon: FolderArchive },
      { name: "Assignments", href: "/assignments", icon: FileCheck2 },
      { name: "Announcements", href: "/announcements", icon: Megaphone },
      { name: "My Profile", href: "/profile", icon: User },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col min-h-screen border-r border-slate-800">
      {/* Workspace / Academic Hierarchy header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.department?.slice(0, 3) || "CSE"}
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">
              {user?.department || "CSE"} Department
            </div>
            <div className="text-[11px] text-slate-400">
              {user?.semester ? `Semester ${user.semester}` : "Academic Faculty"} • 2024-25
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Navigation Menu
          </div>
          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Profile card with real Logout button */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-800/70 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <div className="truncate flex-1">
            <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 truncate">
              {user?.name || "Authenticated User"}
            </div>
            <div className="text-[10px] text-slate-400 truncate font-semibold uppercase tracking-wider text-indigo-400">
              {role || "STUDENT"}
            </div>
          </div>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
