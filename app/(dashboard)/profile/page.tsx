"use client";

import React, { useState } from "react";
import { useUserSession } from "@/context/UserContext";
import {
  User,
  Mail,
  ShieldCheck,
  Building,
  Layers,
  LogOut,
  Calendar,
  Save,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useUserSession();

  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Sync state if user loads after mount
  React.useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Name must be at least 2 characters long.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile name updated successfully!");
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
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
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <User className="w-4 h-4" />
          <span>USER IDENTITY & ACCOUNT SETTINGS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your institutional credentials, department affiliation, and permissions.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-black border text-2xl font-bold shadow-lg shadow-indigo-500/20 shrink-0">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {user.name}
                </h2>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getRoleColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors border border-rose-200 self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{loggingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>

        {/* Read-only Database Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Department</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">{user.department}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Semester</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {user.semester ? `Semester ${user.semester}` : "N/A"}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Portal Roll No.</span>
            </div>
            <div className="font-bold text-slate-900 text-sm font-mono">
              {user.rollNumber || "Not assigned"}
            </div>
          </div>
        </div>

        {/* Edit Name Form */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">
            Update Personal Information
          </h3>

          <form onSubmit={handleUpdateName} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email (Immutable)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-2.5 text-slate-500 bg-slate-100 cursor-not-allowed"
                />
                <span title="Email is locked by institution">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role (Assigned by Server Policy)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={user.role}
                  disabled
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-2.5 text-slate-500 bg-slate-100 cursor-not-allowed font-semibold"
                />
                <span title="Role changes must be approved by Administration">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                For security reasons, users cannot self-promote or modify their own role.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

