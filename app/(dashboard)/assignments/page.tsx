"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUserSession } from "@/context/UserContext";
import { Assignment } from "@/types";
import AssignmentCard from "@/components/assignments/AssignmentCard";
import { FileCheck2, PlusCircle, Filter, Clock, CheckCircle2, Lock } from "lucide-react";

export default function AssignmentsPage() {
  const { isFaculty } = useUserSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignments() {
      try {
        setLoading(true);
        const res = await fetch("/api/assignments");
        if (res.ok) {
          const d = await res.json();
          setAssignments(d.assignments || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAssignments();
  }, []);

  const filteredAssignments = assignments.filter((a) => {
    const isPast = new Date(a.deadline) < new Date();
    if (filter === "ACTIVE") return !isPast;
    if (filter === "EXPIRED") return isPast;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>COURSEWORK & LAB SUBMISSIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Assignments & Lab Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submissions are time-stamped and strictly governed by server-enforced deadline locks.
          </p>
        </div>

        {isFaculty && (
          <Link
            href="/faculty/assignments"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Assignment</span>
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter("ALL")}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Tasks ({assignments.length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              filter === "ACTIVE"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              Active Deadlines (
              {assignments.filter((a) => new Date(a.deadline) > new Date()).length}
              )
            </span>
          </button>
          <button
            onClick={() => setFilter("EXPIRED")}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              filter === "EXPIRED"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              Locked / Expired (
              {assignments.filter((a) => new Date(a.deadline) < new Date()).length}
              )
            </span>
          </button>
        </div>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm">No assignments found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}

