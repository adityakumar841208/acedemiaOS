"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUserSession } from "@/context/UserContext";
import { Module, Assignment } from "@/types";
import {
  PlusCircle,
  FileCheck2,
  Calendar,
  Award,
  Layers,
  Clock,
  Sparkles,
  Users,
  AlertCircle,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ASSIGNMENT_TYPE_CONFIG } from "@/lib/assignment-types";
import { AssignmentType } from "@/types";

interface AssignedSubject {
  id: string; // subjectId
  assignmentId: string;
  code: string;
  name: string;
  departmentId: string;
  branchCode?: string;
  semesterNumber: number;
  status: string;
  assignedAt?: string;
  assignedBy?: string;
  credits?: number;
  description?: string;
  modulesCount?: number;
  modules?: Module[];
}

export default function FacultyAssignmentsPage() {
  const { user, isFaculty, isAdmin } = useUserSession();

  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<AssignedSubject | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("code");
  const [subjectId, setSubjectId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [totalMarks, setTotalMarks] = useState(25);
  const [deadline, setDeadline] = useState("");
  const [allowLate, setAllowLate] = useState(false);
  const [instructionsText, setInstructionsText] = useState(
    "1. Complete the core data structure or algorithm.\n2. Submit runnable source code with driver program.\n3. Automatic similarity checking is enabled."
  );
  const [submitting, setSubmitting] = useState(false);

  // Set default deadline 3 days from now in datetime-local format
  useEffect(() => {
    const future = new Date(Date.now() + 3 * 86400000);
    const isoString = future.toISOString().slice(0, 16);
    setDeadline(isoString);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [subRes, assignRes] = await Promise.all([
        fetch("/api/faculty/subjects"),
        fetch("/api/assignments"),
      ]);

      let subs: AssignedSubject[] = [];
      if (subRes.ok) {
        const d = await subRes.json();
        subs = d.assignedSubjects || [];
      }

      // If user is ADMIN and has no assigned subjects, fallback to /api/subjects so Admin can still test
      if (subs.length === 0 && (user?.role === "ADMIN" || isAdmin)) {
        const fallbackRes = await fetch("/api/subjects");
        if (fallbackRes.ok) {
          const fd = await fallbackRes.json();
          subs = (fd.subjects || []).map((s: any) => ({
            id: s.id,
            assignmentId: `admin-${s.id}`,
            code: s.code,
            name: s.name,
            departmentId: s.departmentId,
            branchCode: s.departmentId?.replace(/^(dept-|department-)/i, "").toUpperCase() || "CSE",
            semesterNumber: s.semesterNumber || 1,
            status: "ACTIVE",
            credits: s.credits || 3,
            description: s.description || "",
            modules: (fd.modules || []).filter((m: any) => m.subjectId === s.id),
          }));
        }
      }

      setAssignedSubjects(subs);

      // Select first subject or maintain current selection
      if (subs.length > 0) {
        const current = subs.find((s) => s.id === subjectId) || subs[0];
        setSubjectId(current.id);
        setSelectedSubject(current);
        if (current.modules && current.modules.length > 0) {
          setModuleId(current.modules[0].id);
        } else {
          setModuleId("mod-gen");
        }
      } else {
        setSubjectId("");
        setSelectedSubject(null);
        setModuleId("");
      }

      if (assignRes.ok) {
        const d = await assignRes.json();
        setAssignments(d.assignments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, subjectId, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    const found = assignedSubjects.find((s) => s.id === newSubjectId) || null;
    setSelectedSubject(found);
    if (found && found.modules && found.modules.length > 0) {
      setModuleId(found.modules[0].id);
    } else {
      setModuleId("mod-gen");
    }
  };

  const groupedAssignments = assignments.reduce<Record<string, Assignment[]>>((groups, assignment) => {
    const groupKey = `${assignment.subjectCode}::${assignment.moduleId}`;
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push(assignment);
    return groups;
  }, {});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignedSubjects.length === 0) {
      toast.error("No subjects have been assigned to you yet. Please contact the Super Admin.");
      return;
    }
    if (!title.trim() || !subjectId || !deadline) {
      toast.error("Please fill in title, subject, and deadline.");
      return;
    }

    try {
      setSubmitting(true);
      const instructions = instructionsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subjectId,
          moduleId: moduleId || (selectedSubject?.modules?.[0]?.id || "mod-gen"),
          totalMarks,
          deadline: new Date(deadline).toISOString(),
          allowLate,
          instructions,
          assignmentType,
          facultyId: user?.id,
          facultyName: user?.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || "Failed to create assignment");
      }

      toast.success("Assignment created and published to class feed!");
      setTitle("");
      setDescription("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
          <Award className="w-4 h-4" />
          <span>FACULTY COURSE MANAGEMENT</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Assignment Studio & Publisher
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Publish coursework with strict server deadline locks and automated plagiarism analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Create Assignment Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-500" />
              <span>Draft New Assignment</span>
            </h3>

            <button
              type="button"
              disabled={assignedSubjects.length === 0}
              onClick={() => {
                setTitle("Lab 4: Dijkstra Shortest Path with Min-Heap Optimization");
                setDescription(
                  "Implement Dijkstra's Single Source Shortest Path algorithm using an adjacency list and a binary min-heap priority queue. Compare running time against standard matrix representation."
                );
                setTotalMarks(30);
              }}
              className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Quick Sample</span>
            </button>
          </div>

          {!loading && assignedSubjects.length === 0 && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-5 text-amber-950 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">No Subjects Assigned</h4>
                  <p className="text-xs text-amber-800 font-medium">Academic Ownership Verification</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                No subjects have been assigned to you yet. Please contact the Super Admin.
              </p>
              <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-slate-600 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Super Admin must allocate curriculum subjects before you can draft assignments.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Subject & Module */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Subject *
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={assignedSubjects.length === 0}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  required
                >
                  {assignedSubjects.length === 0 ? (
                    <option value="">No subjects assigned</option>
                  ) : (
                    assignedSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name} ({s.branchCode || s.departmentId}, Sem {s.semesterNumber})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associated Module
                </label>
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  disabled={assignedSubjects.length === 0 || !(selectedSubject?.modules && selectedSubject.modules.length > 0)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {selectedSubject?.modules && selectedSubject.modules.length > 0 ? (
                    selectedSubject.modules.map((m: any, idx: number) => (
                      <option key={m.id || `mod-${idx}`} value={m.id || `mod-${idx}`}>
                        Module {m.moduleNumber || idx + 1}: {m.title.slice(0, 28)}...
                      </option>
                    ))
                  ) : (
                    <option value="mod-gen">Module 1: General Curriculum</option>
                  )}
                </select>
              </div>
            </div>

            {/* Inherited Academic Context Banner */}
            {selectedSubject && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Branch:</span>
                  <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedSubject.branchCode || selectedSubject.departmentId}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Semester:</span>
                  <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Semester {selectedSubject.semesterNumber}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subject:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSubject.code} · {selectedSubject.name}
                  </span>
                </div>
                {selectedSubject.credits && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Credits:</span>
                    <span className="font-semibold text-slate-700">{selectedSubject.credits}</span>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignment Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lab 4: AVL Trees vs Red-Black Performance Benchmark"
                className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                required
                disabled={assignedSubjects.length === 0}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Problem Description & Objective
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed statement, expected inputs, complexity requirements..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                disabled={assignedSubjects.length === 0}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="assignment-type">
                Assignment Type *
              </label>
              <select
                id="assignment-type"
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
                disabled={assignedSubjects.length === 0}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {Object.entries(ASSIGNMENT_TYPE_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {ASSIGNMENT_TYPE_CONFIG[assignmentType].description} Accepted: {ASSIGNMENT_TYPE_CONFIG[assignmentType].accept || "written answer only"}.
              </p>
            </div>

            {/* Marks & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Maximum Marks
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  disabled={assignedSubjects.length === 0}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hard Deadline (Time-Locked) *
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={assignedSubjects.length === 0}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Instructions (One per line)
              </label>
              <textarea
                rows={3}
                value={instructionsText}
                onChange={(e) => setInstructionsText(e.target.value)}
                disabled={assignedSubjects.length === 0}
                className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Late Submission policy */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                  disabled={assignedSubjects.length === 0}
                  className="rounded text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
                />
                <span>Allow late submissions (otherwise hard lock rejects after deadline)</span>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting || assignedSubjects.length === 0}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Publishing..." : "Publish Assignment"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Active Assignments & Grading Shortcuts */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-500" />
              <span>Published Course Tasks</span>
            </h3>

            <div className="space-y-4">
              {Object.entries(groupedAssignments).map(([groupKey, group]) => {
                const first = group[0];
                return (
                  <section key={groupKey} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                          {first.subjectCode} · {first.subjectName}
                        </div>
                        <div className="text-xs font-semibold text-slate-700">Module: {first.moduleTitle}</div>
                      </div>
                      <span className="text-[11px] text-slate-400">{group.length} task{group.length === 1 ? "" : "s"}</span>
                    </div>
                    {group.map((a) => (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 line-clamp-1">{a.title}</span>
                          <span className="text-slate-400 font-mono shrink-0 ml-2">{a.totalMarks} Marks</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Due: {formatDate(a.deadline)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <Link
                            href={`/faculty/submissions/${a.id}`}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Review Submissions →</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

