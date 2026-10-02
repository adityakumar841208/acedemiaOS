"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useUserSession } from "@/context/UserContext";
import { Assignment } from "@/types";
import {
  PlusCircle,
  FileCheck2,
  Calendar,
  Award,
  Layers,
  Clock,
  Sparkles,
  Users,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building,
  BookOpen,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ASSIGNMENT_TYPE_CONFIG } from "@/lib/assignment-types";
import { AssignmentType } from "@/types";

export interface AssignedSubjectItem {
  id: string;
  code: string;
  name: string;
  departmentId?: string;
  branchCode?: string;
  semesterNumber?: number;
  credits?: number;
  modulesCount?: number;
  modules?: Array<{
    id: string;
    moduleNumber: number;
    title: string;
    description?: string;
    topics?: string[];
  }>;
}

export default function FacultyAssignmentsPage() {
  const { user } = useUserSession();

  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubjectItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("code");
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

      let subjectsList: AssignedSubjectItem[] = [];
      if (subRes.ok) {
        const d = await subRes.json();
        subjectsList = d.assignedSubjects || [];
      }

      // If user is ADMIN and has no explicit faculty allocations, load canonical catalog
      if (subjectsList.length === 0 && user?.role === "ADMIN") {
        const allRes = await fetch("/api/subjects");
        if (allRes.ok) {
          const allData = await allRes.json();
          subjectsList = allData.subjects || [];
        }
      }

      setAssignedSubjects(subjectsList);

      if (assignRes.ok) {
        const d = await assignRes.json();
        setAssignments(d.assignments || []);
      }
    } catch (err) {
      console.error("Failed to load faculty course tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute available branches from the faculty's assigned subjects
  const availableBranches = useMemo(() => {
    const branchCodeMap = new Map<string, string>();
    assignedSubjects.forEach((s) => {
      const code = (
        s.branchCode ||
        s.departmentId?.replace(/^(dept-|department-)/i, "") ||
        ""
      ).toUpperCase();
      if (code) {
        branchCodeMap.set(code, code);
      }
    });

    const branchNameMap: Record<string, string> = {
      CSE: "Computer Science & Engineering (CSE)",
      ECE: "Electronics & Communication Engineering (ECE)",
      ME: "Mechanical Engineering (ME)",
      CE: "Civil Engineering (CE)",
      IT: "Information Technology (IT)",
      EE: "Electrical Engineering (EE)",
    };

    return Array.from(branchCodeMap.keys()).map((code) => ({
      code,
      name: branchNameMap[code] || `${code} Department`,
    }));
  }, [assignedSubjects]);

  // Compute filtered subjects for selected branch
  const filteredSubjects = useMemo(() => {
    if (!selectedBranchCode) return [];
    return assignedSubjects.filter((s) => {
      const code = (
        s.branchCode ||
        s.departmentId?.replace(/^(dept-|department-)/i, "") ||
        ""
      ).toUpperCase();
      return code === selectedBranchCode;
    });
  }, [assignedSubjects, selectedBranchCode]);

  // Compute current selected subject and its modules
  const currentSubject = useMemo(() => {
    return assignedSubjects.find((s) => s.id === selectedSubjectId);
  }, [assignedSubjects, selectedSubjectId]);

  const currentModules = useMemo(() => {
    return currentSubject?.modules || [];
  }, [currentSubject]);

  const isStepCompleted = Boolean(selectedBranchCode && selectedSubjectId);

  const handleBranchChange = (branchCode: string) => {
    setSelectedBranchCode(branchCode);
    setSelectedSubjectId("");
    setSelectedModuleId("");
  };

  const handleSubjectChange = (subId: string) => {
    setSelectedSubjectId(subId);
    const sub = assignedSubjects.find((s) => s.id === subId);
    const firstMod = sub?.modules?.[0];
    setSelectedModuleId(firstMod?.id || "");
  };

  const groupedAssignments = assignments.reduce<Record<string, Assignment[]>>((groups, assignment) => {
    const groupKey = `${assignment.subjectCode}::${assignment.moduleId}`;
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push(assignment);
    return groups;
  }, {});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchCode || !selectedSubjectId) {
      toast.error("Please complete Step 1 (Department/Branch) and Step 2 (Assigned Subject) first.");
      return;
    }

    if (!title.trim() || !deadline) {
      toast.error("Please fill in assignment title and deadline.");
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
          title: title.trim(),
          description: description.trim(),
          subjectId: selectedSubjectId,
          moduleId: selectedModuleId || currentModules[0]?.id || "mod-gen",
          totalMarks: Number(totalMarks),
          deadline: new Date(deadline).toISOString(),
          allowLate,
          instructions,
          assignmentType,
          facultyId: user?.id,
          facultyName: user?.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create assignment");
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
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-500" />
              <span>Draft New Assignment</span>
            </h3>

            <button
              type="button"
              disabled={!isStepCompleted}
              onClick={() => {
                if (!isStepCompleted) return;
                setTitle(`Lab Practice: ${currentSubject?.name || "Problem Analysis"}`);
                setDescription(
                  `Practical implementation and algorithmic analysis for ${currentSubject?.code} (${currentSubject?.name}). Analyze theoretical time complexity vs empirical runtime.`
                );
                setTotalMarks(30);
              }}
              className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Quick Sample</span>
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            {/* Step 1 & Step 2: Academic Department & Assigned Subject Hierarchy */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Academic Scope Verification
                  </span>
                </div>
                {isStepCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Scope Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Locked</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Step 1: Department / Branch Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Step 1: Department / Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedBranchCode}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  >
                    <option value="">Select your department / branch...</option>
                    {availableBranches.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Filtered to departments where you have active teaching assignments.
                  </p>
                </div>

                {/* Step 2: Assigned Subject Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Step 2: Subject (Assigned Only) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    disabled={!selectedBranchCode || filteredSubjects.length === 0}
                    className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">
                      {!selectedBranchCode
                        ? "← Select department first"
                        : filteredSubjects.length === 0
                        ? "No subjects assigned in this branch"
                        : "Select an assigned subject..."}
                    </option>
                    {filteredSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name} (Semester {s.semesterNumber})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Only subjects assigned to your faculty profile appear here.
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              {!selectedBranchCode ? (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>Choose your Department / Branch to view your assigned subjects.</span>
                </div>
              ) : !selectedSubjectId ? (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>Select an assigned subject above to unlock assignment creation.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Teaching Scope Verified: <strong>{currentSubject?.code} - {currentSubject?.name}</strong> ({currentSubject?.branchCode}, Semester {currentSubject?.semesterNumber})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-white px-2 py-0.5 rounded shadow-2xs">
                    Form Unlocked
                  </span>
                </div>
              )}
            </div>

            {/* Zero Subjects Callout */}
            {!loading && assignedSubjects.length === 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>No Teaching Subjects Assigned</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  You currently do not have any subjects assigned to your faculty profile. Faculty members cannot create assignments outside their assigned scope. Please contact your college administrator to assign subjects to you in the Admin Portal.
                </p>
              </div>
            )}

            {/* Step 3: Assignment Configuration (Strictly Locked until Branch and Subject are verified) */}
            <div
              className={`space-y-4 transition-all duration-200 ${
                !isStepCompleted ? "opacity-50 pointer-events-none select-none" : ""
              }`}
            >
              {/* Associated Module */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associated Curriculum Module
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  disabled={!isStepCompleted}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {currentModules.length === 0 ? (
                    <option value="">General Coursework</option>
                  ) : (
                    currentModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        Module {m.moduleNumber}: {m.title.slice(0, 36)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!isStepCompleted}
                  placeholder="e.g. Lab 4: AVL Trees vs Red-Black Performance Benchmark"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:bg-slate-100"
                  required
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
                  disabled={!isStepCompleted}
                  placeholder="Detailed statement, expected inputs, complexity requirements..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:bg-slate-100"
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
                  disabled={!isStepCompleted}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:bg-slate-100"
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
                    disabled={!isStepCompleted}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:bg-slate-100"
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
                    disabled={!isStepCompleted}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:bg-slate-100"
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
                  disabled={!isStepCompleted}
                  className="w-full text-xs font-mono rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed disabled:bg-slate-100"
                />
              </div>

              {/* Late Submission policy */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={allowLate}
                    onChange={(e) => setAllowLate(e.target.checked)}
                    disabled={!isStepCompleted}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Allow late submissions (otherwise hard lock rejects after deadline)</span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !isStepCompleted}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {!isStepCompleted && <Lock className="w-4 h-4" />}
                  <span>{submitting ? "Publishing..." : isStepCompleted ? "Publish Assignment" : "Select Subject to Unlock"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Col: Active Assignments & Grading Shortcuts */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-500" />
              <span>Published Course Tasks</span>
            </h3>

            <div className="space-y-4">
              {Object.entries(groupedAssignments).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No published assignments yet. Select your assigned subject to publish your first coursework.
                </div>
              ) : (
                Object.entries(groupedAssignments).map(([groupKey, group]) => {
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
                        <span className="text-[11px] text-slate-400">
                          {group.length} task{group.length === 1 ? "" : "s"}
                        </span>
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
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
