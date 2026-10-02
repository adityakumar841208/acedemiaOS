"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUserSession } from "@/context/UserContext";
import {
  Bell,
  GraduationCap,
  Layers,
  Check,
  Search,
  ExternalLink,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { AnimatedList } from "@/components/ui/animated-list";

export default function Navbar() {
  const {
    user,
    role,
    isAuthenticated,
    logout,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useUserSession();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const recentNotifications = [...notifications]
  .sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  )
  .slice(0, 3);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadgeStyle = (r: string | null) => {
    switch (r) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "FACULTY":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "CR":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "STUDENT":
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const semester = user?.semester;
  const validStudentSemester =
    role === "STUDENT" &&
    typeof semester === "number" &&
    Number.isInteger(semester) &&
    semester >= 1 &&
    semester <= 8
      ? semester
      : null;
  const academicSession = validStudentSemester !== null
    ? (() => {
        const now = new Date();
        const academicYearStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
        const sessionStart = academicYearStart - Math.floor((validStudentSemester - 1) / 2);
        return `${sessionStart}-${String(sessionStart + 1).slice(-2)}`;
      })()
    : null;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand & Hierarchy Context */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1 group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-950 group-hover:scale-105 transition-transform">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={60}
                  height={60}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1">
                  Academia<span className="text-amber-700">OS</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block -mt-1">
                  Academic Portal
                </span>
              </div>
            </Link>

            {/* Academic Hierarchy Breadcrumb Pill */}
            {validStudentSemester !== null && academicSession && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs text-slate-600">
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-semibold text-slate-800">{user?.department || "CSE"}</span>
                <span className="text-slate-300">/</span>
                <span>Semester {validStudentSemester}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500">{academicSession}</span>
              </div>
            )}

          </div>

          {/* Center: Search Link / Filter */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-2">
            <Link
              href="/resources"
              className="w-full flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200 text-xs transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search subjects, modules, notes, PYQs...</span>
              <kbd className="ml-auto hidden xl:inline-block px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-500">
                vault
              </kbd>
            </Link>
          </div>

          {/* Right: Tools & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* In-App Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  const nextOpenState = !notifOpen;

                  if (nextOpenState) {
                    markAllNotificationsRead();
                  }

                  setNotifOpen(nextOpenState);
                }}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {/* Notification Dropdown */}
{notifOpen && (
  <div
    className="
      absolute right-0 mt-3 z-50
      w-[calc(100vw-2rem)] max-w-95
      overflow-hidden
      rounded-2xl
      border border-slate-200/80
      bg-white
      shadow-[0_20px_50px_rgba(15,23,42,0.14)]
    "
  >
    {/* Header */}
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Notifications
          </h3>

          {unreadCount > 0 && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
              {unreadCount} new
            </span>
          )}
        </div>

        <p className="mt-0.5 text-[10px] text-slate-400">
          Your latest updates
        </p>
      </div>

      {unreadCount > 0 && (
        <button
          onClick={markAllNotificationsRead}
          className="
            inline-flex items-center gap-1
            rounded-lg px-2 py-1
            text-[10px] font-semibold
            text-indigo-600
            transition-colors
            hover:bg-indigo-50
            hover:text-indigo-700
          "
        >
          <Check className="h-3 w-3" />
          Mark all read
        </button>
      )}
    </div>

    {/* Notification viewport */}
    <div className="relative max-h-80 overflow-y-auto">
      {recentNotifications.length === 0 ? (
        <div className="p-6">
          <div
            className="
              flex flex-col items-center justify-center
              rounded-xl
              border border-dashed border-slate-200
              bg-slate-50/70
              px-4 py-8
            "
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/70">
              <Bell className="h-4 w-4" />
            </div>

            <p className="text-xs font-medium text-slate-500">
              No notifications yet
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              You`&apos;`re all caught up.
            </p>
          </div>
        </div>
      ) : (
        <AnimatedList
          delay={350}
          className="flex flex-col gap-2 p-2"
        >
          {recentNotifications.slice().reverse().map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`
                group relative
                cursor-pointer
                overflow-hidden
                rounded-xl
                border
                px-3 py-3
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-sm
                ${
                  n.isRead
                    ? "border-slate-200 bg-white hover:border-slate-300"
                    : "border-indigo-100 bg-indigo-50/40 hover:border-indigo-200"
                }
              `}
            >
              {/* Unread indicator */}
              {!n.isRead && (
                <span
                  className="
                    absolute left-0 top-3 bottom-3
                    w-0.5
                    rounded-r-full
                    bg-indigo-500
                  "
                />
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-lg
                    ${
                      n.isRead
                        ? "bg-slate-100 text-slate-400"
                        : "bg-indigo-100 text-indigo-600"
                    }
                  `}
                >
                  <Bell className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  {/* Title + time */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-1.5">
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      )}

                      <p className="truncate text-xs font-semibold text-slate-800">
                        {n.title}
                      </p>
                    </div>

                    <time className="shrink-0 whitespace-nowrap text-[10px] text-slate-400">
                      {formatRelativeTime(n.createdAt)}
                    </time>
                  </div>

                  {/* Message */}
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                    {n.message}
                  </p>

                  {/* Details */}
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotifOpen(false);
                      }}
                      className="
                        mt-2 inline-flex
                        items-center gap-1
                        rounded-md
                        text-[10px]
                        font-semibold
                        text-indigo-600
                        transition-colors
                        hover:text-indigo-700
                      "
                    >
                      View details
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </AnimatedList>
      )}
    </div>

    {/* Footer */}
    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-center">
      <Link
        href="/announcements"
        onClick={() => setNotifOpen(false)}
        className="
          text-[11px]
          font-semibold
          text-slate-500
          transition-colors
          hover:text-indigo-600
        "
      >
        View All Announcements & Alerts
        <span className="ml-1">→</span>
      </Link>
    </div>
  </div>
)}
            </div>

            {/* Authenticated User Profile Dropdown */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-amber-500 to-yellow-300 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-900 leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <span className="font-bold text-indigo-600">{user.role}</span>
                      {user.rollNumber && <span>• {user.rollNumber}</span>}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      <div className="mt-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
                            user.role
                          )}`}
                        >
                          {user.role} Account
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Account Profile</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
