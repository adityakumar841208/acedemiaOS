"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUserSession } from "@/context/UserContext";
import {
  ShieldAlert,
  RotateCcw,
  Users,
  GraduationCap,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import PendingStudentApprovals from "@/components/auth/PendingStudentApprovals";
import AdminNavigation from "@/components/admin/AdminNavigation";

export default function AdminPage() {
  const { refreshData } = useUserSession();
  const [resetting, setResetting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<{
    users: {
      totalUsers: number;
      totalStudents: number;
      totalFaculty: number;
      totalCRs: number;
      totalAdmins: number;
      activeUsers: number;
      pendingUsers: number;
      pendingStudents: number;
      suspendedUsers: number;
      rejectedUsers: number;
    };
    branches: {
      totalBranches: number;
      activeBranches: number;
      inactiveBranches: number;
    };
    distribution: Array<{
      id: string;
      name: string;
      code: string;
      status: string;
      isActive: boolean;
      students: number;
      faculty: number;
      crs: number;
      total: number;
    }>;
  }>({
    users: {
      totalUsers: 0,
      totalStudents: 0,
      totalFaculty: 0,
      totalCRs: 0,
      totalAdmins: 0,
      activeUsers: 0,
      pendingUsers: 0,
      pendingStudents: 0,
      suspendedUsers: 0,
      rejectedUsers: 0,
    },
    branches: {
      totalBranches: 0,
      activeBranches: 0,
      inactiveBranches: 0,
    },
    distribution: [],
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReset = async () => {
    try {
      setResetting(true);
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        await refreshData();
        toast.success("Database restored to default demo state!");
        fetchStats();
      } else {
        toast.error("Database reset failed");
      }
    } catch {
      toast.error("Database reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Admin Top Navigation */}
      <AdminNavigation
        counts={{
          faculty: stats.users.totalFaculty,
          students: stats.users.totalStudents,
          branches: stats.branches.totalBranches,
          users: stats.users.totalUsers,
        }}
      />

      <PendingStudentApprovals />

      {/* Title & Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>CENTRAL ACADEMIC ADMINISTRATION CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            System Administration & Academic Structure
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Institutional overview, dynamic branch allocations, faculty affiliations, and student directories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStats()}
            title="Refresh statistics"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto disabled:opacity-60 cursor-pointer"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
            <span>{resetting ? "Resetting State..." : "Reset Demo Data"}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Key Metric Cards from MongoDB */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Branches */}
        <Link
          href="/admin/branches"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Academic Branches</span>
            <Building className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.branches.totalBranches}
          </div>
          <div className="text-[11px] text-indigo-600 mt-0.5 flex items-center justify-between">
            <span>{stats.branches.activeBranches} Active Departments</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>

        {/* Faculty */}
        <Link
          href="/admin/faculty"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Faculty Members</span>
            <Briefcase className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.users.totalFaculty}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5 flex items-center justify-between">
            <span>Multi-branch educators</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>

        {/* Students */}
        <Link
          href="/admin/students"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Students</span>
            <GraduationCap className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.users.totalStudents}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5 flex items-center justify-between">
            <span>{stats.users.pendingStudents} Pending Verification</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>

        {/* All Users */}
        <Link
          href="/admin/users"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total User Accounts</span>
            <Users className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.users.totalUsers}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 flex items-center justify-between">
            <span>{stats.users.activeUsers} Active Accounts</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      </div>

      {/* Academic Distribution Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              <span>Departmental Distribution & Statistics</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live census breakdown across academic branches configured in MongoDB.
            </p>
          </div>
          <Link
            href="/admin/branches"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Manage Branches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Head of Department</th>
                <th className="py-3 px-4 text-center">Faculty</th>
                <th className="py-3 px-4 text-center">Students</th>
                <th className="py-3 px-4 text-center">CRs</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.distribution.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No branches configured.
                  </td>
                </tr>
              ) : (
                stats.distribution.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {d.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                        {d.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {d.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs">
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-purple-700">
                      {d.faculty}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">
                      {d.students}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-700">
                      {d.crs}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {d.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              <span className="font-semibold text-slate-800">Branch & Department Engine</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Operational</span>
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              MongoDB-backed dynamic branch collections with multi-branch faculty assignment and safe deactivation protection.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Academic Tree Visualizer</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Dynamically groups students into Branch &rarr; Semester &rarr; Student nodes with real-time census counts.
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
              Real-time millisecond countdown check on all assignment submission routes.
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
        </div>
      </div>

      {/* Demo Reset Box */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl p-6 sm:p-8 space-y-3">
        <h3 className="font-bold text-purple-950 text-base">
          Hackathon Evaluator Reset Utility
        </h3>
        <p className="text-xs text-purple-900 leading-relaxed max-w-2xl">
          If you have tested creating branches, assigning faculty, submitting assignments, or enrolling students and would like to restore the pristine starting state, click below.
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          {resetting ? "Resetting..." : "Restore Pristine Demo State"}
        </button>
      </div>
    </div>
  );
}
