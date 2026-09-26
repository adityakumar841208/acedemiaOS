"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
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

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand & Hierarchy Context */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1">
                  Academia<span className="text-indigo-600">OS</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block -mt-1">
                  Academic Portal
                </span>
              </div>
            </Link>

            {/* Academic Hierarchy Breadcrumb Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs text-slate-600">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-800">{user?.department || "CSE"}</span>
              <span className="text-slate-300">/</span>
              <span>Semester {user?.semester || 3}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">2024-25</span>
            </div>
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
                onClick={() => setNotifOpen(!notifOpen)}
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
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-xs ${
                            !n.isRead ? "bg-indigo-50/40" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-slate-800">{n.title}</div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => setNotifOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-medium mt-1.5 hover:underline"
                            >
                              <span>View details</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-slate-100 text-center">
                    <Link
                      href="/announcements"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-slate-500 hover:text-indigo-600 font-medium"
                    >
                      View All Announcements & Alerts →
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
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
