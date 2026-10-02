"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUserSession } from "@/context/UserContext";
import { Subject, Module, Assignment, AssignmentType } from "@/types";
import {
  PlusCircle,
  FileCheck2,
  Calendar,
  Award,
  Layers,
  Clock,
  Sparkles,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Building2,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ASSIGNMENT_TYPE_CONFIG } from "@/lib/assignment-types";

interface EnrichedAssignment extends Assignment {
  totalSubmissions: number;
  totalStudents?: number;
  notSubmittedCount?: number;
  pendingCount: number;
  evaluatedCount: number;
  lateCount: number;
  averageScore: number;
  progressPercentage: number;
  isPastDeadline: boolean;
  evaluationStatus: "NO_SUBMISSIONS" | "PENDING_EVALUATION" | "FULLY_EVALUATED";
}

interface BranchItem {
  _id: string;
  name: string;
  code: string;
}

export default function FacultyAssignmentsPage() {
  const { user, isFaculty } = useUserSession();

  // Top-level Navigation: "CREATE" vs "HISTORY"
  const [activeView, setActiveView] = useState<"CREATE" | "HISTORY">("HISTORY");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for Creating Assignment
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

  // Filter & Search State for Past Assignments
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("ALL");
  const [filterSemester, setFilterSemester] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "PAST" | "EVALUATED" | "PENDING">("ALL");

  // Set default deadline 3 days from now
  useEffect(() => {
    const future = new Date(Date.now() + 3 * 86400000);
    const isoString = future.toISOString().slice(0, 16);
    setDeadline(isoString);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subRes, assignRes, branchRes] = await Promise.all([
        fetch("/api/subjects"),
        fetch("/api/assignments"),
        fetch("/api/branches"),
      ]);

      if (subRes.ok) {
        const d = await subRes.json();
        setSubjects(d.subjects || []);
        setModules(d.modules || []);
        if (d.subjects?.length > 0 && !subjectId) {
          setSubjectId(d.subjects[0].id);
        }
      }
      if (assignRes.ok) {
        const d = await assignRes.json();
        setAssignments(d.assignments || []);
      }
      if (branchRes.ok) {
        const d = await branchRes.json();
        setBranches(d.branches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredModules = modules.filter((m) => m.subjectId === subjectId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
          moduleId: moduleId || filteredModules[0]?.id,
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
        throw new Error(err.error || "Failed to create assignment");
      }

      toast.success("Assignment created and published to class feed!");
      setTitle("");
      setDescription("");
      await loadData();
      setActiveView("HISTORY");
    } catch (err: any) {
      toast.error(err.message || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // Filtering & Hierarchy Calculation for Past Assignments
  // Hierarchy: Department / Branch -> Semester -> Subject -> Assignment
  // =========================================================================
  const filteredPastAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Branch filter
      const deptCode = a.departmentId.replace("dept-", "").toUpperCase();
      if (filterBranch !== "ALL" && deptCode !== filterBranch) return false;

      // Semester filter
      if (filterSemester !== "ALL" && String(a.semesterNumber) !== filterSemester) return false;

      // Subject filter
      if (filterSubject !== "ALL" && a.subjectCode !== filterSubject) return false;

      // Status filter
      if (filterStatus === "ACTIVE" && a.isPastDeadline) return false;
      if (filterStatus === "PAST" && !a.isPastDeadline) return false;
      if (filterStatus === "EVALUATED" && (a.totalSubmissions === 0 || a.pendingCount > 0)) return false;
      if (filterStatus === "PENDING" && a.pendingCount === 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          a.title.toLowerCase().includes(q) ||
          a.subjectName.toLowerCase().includes(q) ||
          a.subjectCode.toLowerCase().includes(q) ||
          a.moduleTitle.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [assignments, filterBranch, filterSemester, filterSubject, filterStatus, searchQuery]);

  // Group filtered assignments hierarchically: Branch -> Semester -> Subject -> Assignment[]
  const hierarchicalAssignments = useMemo(() => {
    const hierarchy: Record<
      string, // Branch Code
      Record<
        number, // Semester Number
        Record<
          string, // Subject Code + Name
          EnrichedAssignment[]
        >
      >
    > = {};

    filteredPastAssignments.forEach((a) => {
      const branchKey = a.departmentId.replace("dept-", "").toUpperCase() || "CSE";
      const semKey = a.semesterNumber || 3;
      const subjectKey = `${a.subjectCode} — ${a.subjectName}`;

      if (!hierarchy[branchKey]) hierarchy[branchKey] = {};
      if (!hierarchy[branchKey][semKey]) hierarchy[branchKey][semKey] = {};
      if (!hierarchy[branchKey][semKey][subjectKey]) hierarchy[branchKey][semKey][subjectKey] = [];

      hierarchy[branchKey][semKey][subjectKey].push(a);
    });

    return hierarchy;
  }, [filteredPastAssignments]);

  const uniqueSubjectCodes = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      if (a.subjectCode) set.add(a.subjectCode);
    });
    return Array.from(set);
  }, [assignments]);

  const totalCourseworkCount = assignments.length;
  const totalSubmissionsCount = assignments.reduce((acc, a) => acc + a.totalSubmissions, 0);
  const totalEvaluatedCount = assignments.reduce((acc, a) => acc + a.evaluatedCount, 0);
  const totalPendingCount = assignments.reduce((acc, a) => acc + a.pendingCount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
              <Award className="w-4 h-4 text-amber-600" />
              <span>FACULTY ACADEMIC MANAGEMENT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Coursework & Past Assignments
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Publish coursework, track turn-in metrics, and access permanent academic submission and evaluation records.
            </p>
          </div>

          {/* Toggle between Studio (Create) and Past Assignments (History) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveView("HISTORY")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                activeView === "HISTORY"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Past Assignments ({assignments.length})</span>
            </button>
            <button
              onClick={() => setActiveView("CREATE")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                activeView === "CREATE"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Create Assignment</span>
            </button>
          </div>
        </div>

        {/* Live Academic Statistics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{totalCourseworkCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Academic assignments</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">Total Submitted</span>
            <div className="text-xl sm:text-2xl font-bold text-indigo-900 mt-1">{totalSubmissionsCount}</div>
            <div className="text-[11px] text-indigo-700 mt-0.5">Permanent records in DB</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Evaluated</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-900 mt-1">{totalEvaluatedCount}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Marks & feedback recorded</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pending Evaluation</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-900 mt-1">{totalPendingCount}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Awaiting instructor marks</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PAST ASSIGNMENTS & HISTORICAL ACADEMIC RECORDS */}
      {/* ========================================================================= */}
      {activeView === "HISTORY" && (
        <div className="space-y-6">
          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by assignment title, subject name, or code..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Status Filter Badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(["ALL", "ACTIVE", "PAST", "PENDING", "EVALUATED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                      filterStatus === status
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                  >
                    {status === "ALL"
                      ? "All Tasks"
                      : status === "ACTIVE"
                      ? "Active Deadlines"
                      : status === "PAST"
                      ? "Closed / Expired"
                      : status === "PENDING"
                      ? "Pending Grading"
                      : "Fully Evaluated"}
                  </button>
                ))}
              </div>
            </div>

            {/* Hierarchical Filter Selectors: Branch, Semester, Subject */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Academic Filters:</span>
              </div>

              {/* Branch Filter */}
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="ALL">All Branches / Departments</option>
                {branches.length > 0
                  ? branches.map((b) => (
                      <option key={b._id} value={b.code}>
                        {b.code} — {b.name}
                      </option>
                    ))
                  : [
                      <option key="CSE" value="CSE">
                        CSE — Computer Science
                      </option>,
                      <option key="ECE" value="ECE">
                        ECE — Electronics
                      </option>,
                    ]}
              </select>

              {/* Semester Filter */}
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="ALL">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={String(sem)}>
                    Semester {sem}
                  </option>
                ))}
              </select>

              {/* Subject Filter */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="ALL">All Subjects</option>
                {uniqueSubjectCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>

              {(filterBranch !== "ALL" ||
                filterSemester !== "ALL" ||
                filterSubject !== "ALL" ||
                filterStatus !== "ALL" ||
                searchQuery.trim()) && (
                <button
                  onClick={() => {
                    setFilterBranch("ALL");
                    setFilterSemester("ALL");
                    setFilterSubject("ALL");
                    setFilterStatus("ALL");
                    setSearchQuery("");
                  }}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold px-2 py-1"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Past Assignments List Organized by Hierarchy: Branch -> Semester -> Subject -> Assignment */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : Object.keys(hierarchicalAssignments).length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Archive className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Past Assignments Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No assignments match your selected branch, semester, or subject filters.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(hierarchicalAssignments).map(([branchCode, semesters]) => (
                <div key={branchCode} className="space-y-4">
                  {/* Branch Level Header */}
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      DEPARTMENT / BRANCH: {branchCode}
                    </h2>
                  </div>

                  {Object.entries(semesters).map(([semNumber, subjectsMap]) => (
                    <div key={semNumber} className="pl-2 sm:pl-4 space-y-4">
                      {/* Semester Level Subheader */}
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        <span className="uppercase tracking-wider">
                          Semester {semNumber} Academic Records
                        </span>
                      </div>

                      {Object.entries(subjectsMap).map(([subjectHeading, assignmentList]) => (
                        <div key={subjectHeading} className="pl-2 sm:pl-4 space-y-3">
                          {/* Subject Level Subheader */}
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                            <span>{subjectHeading}</span>
                            <span className="text-slate-400 text-[11px]">
                              ({assignmentList.length} task{assignmentList.length === 1 ? "" : "s"})
                            </span>
                          </div>

                          {/* Grid of Past Assignment Cards for this Subject */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignmentList.map((assignment) => {
                              const totalStudents =
                                assignment.totalStudents || Math.max(6, assignment.totalSubmissions);
                              const submittedCount = assignment.totalSubmissions;
                              const notSubmittedCount =
                                assignment.notSubmittedCount !== undefined
                                  ? assignment.notSubmittedCount
                                  : Math.max(0, totalStudents - submittedCount);
                              const evaluatedCount = assignment.evaluatedCount;
                              const pendingCount = assignment.pendingCount;

                              return (
                                <div
                                  key={assignment.id}
                                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                                >
                                  {/* Card Top: Title, Subject, Context */}
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                                            {assignment.subjectCode}
                                          </span>
                                          <span className="text-xs text-slate-500 font-medium">
                                            {branchCode} • Semester {assignment.semesterNumber}
                                          </span>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors leading-snug">
                                          {assignment.title}
                                        </h3>
                                      </div>

                                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                                        <Award className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{assignment.totalMarks} Marks</span>
                                      </div>
                                    </div>

                                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                                      <span>
                                        Created: <strong>{formatDate(assignment.createdAt)}</strong>
                                      </span>
                                      <span>
                                        Due: <strong>{formatDate(assignment.deadline)}</strong>
                                      </span>
                                    </div>

                                    {/* Real Database Submission Statistics */}
                                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2 text-xs">
                                      <div className="flex items-center justify-between font-semibold">
                                        <span className="text-slate-600">Submitted</span>
                                        <span className="text-slate-900 font-mono text-sm">
                                          {submittedCount} / {totalStudents}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                                        <div>
                                          <span className="text-slate-400 block">Not Submitted</span>
                                          <span className="font-bold text-slate-700">{notSubmittedCount}</span>
                                        </div>
                                        <div>
                                          <span className="text-emerald-700 block font-medium">Evaluated</span>
                                          <span className="font-bold text-emerald-800">{evaluatedCount}</span>
                                        </div>
                                        <div>
                                          <span className="text-amber-700 block font-medium">Pending</span>
                                          <span className="font-bold text-amber-800">{pendingCount}</span>
                                        </div>
                                      </div>

                                      {/* Evaluation Progress Bar */}
                                      <div className="pt-1">
                                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all ${
                                              assignment.progressPercentage === 100
                                                ? "bg-emerald-500"
                                                : assignment.progressPercentage > 0
                                                ? "bg-amber-500"
                                                : "bg-slate-300"
                                            }`}
                                            style={{ width: `${assignment.progressPercentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card Action Row */}
                                  <div className="pt-2 flex items-center justify-between">
                                    <span
                                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                        assignment.isPastDeadline
                                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      }`}
                                    >
                                      {assignment.isPastDeadline ? "Deadline Passed" : "Active"}
                                    </span>

                                    <Link
                                      href={`/faculty/submissions/${assignment.id}`}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
                                    >
                                      <Users className="w-3.5 h-3.5" />
                                      <span>View Submissions</span>
                                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CREATE & DRAFT NEW ASSIGNMENT STUDIO */}
      {/* ========================================================================= */}
      {activeView === "CREATE" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                <span>Draft New Assignment</span>
              </h3>

              <button
                type="button"
                onClick={() => {
                  setTitle("Lab 4: Dijkstra Shortest Path with Min-Heap Optimization");
                  setDescription(
                    "Implement Dijkstra's Single Source Shortest Path algorithm using an adjacency list and a binary min-heap priority queue. Benchmark complexity against matrix representations."
                  );
                  setTotalMarks(30);
                }}
                className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Sample</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Subject & Module */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Subject *
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      const fm = modules.find((m) => m.subjectId === e.target.value);
                      if (fm) setModuleId(fm.id);
                    }}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Associated Module
                  </label>
                  <select
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {filteredModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        Module {m.moduleNumber}: {m.title.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>
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
                  placeholder="e.g. Lab 4: AVL Trees vs Red-Black Performance Benchmark"
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  placeholder="Detailed statement, expected inputs, complexity requirements..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-slate-700 mb-1"
                  htmlFor="assignment-type"
                >
                  Assignment Type *
                </label>
                <select
                  id="assignment-type"
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {Object.entries(ASSIGNMENT_TYPE_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {ASSIGNMENT_TYPE_CONFIG[assignmentType].description} Accepted:{" "}
                  {ASSIGNMENT_TYPE_CONFIG[assignmentType].accept || "written answer only"}.
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
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Late Submission Policy */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={allowLate}
                    onChange={(e) => setAllowLate(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Allow late submissions (otherwise hard lock rejects after deadline)</span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Assignment"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Active Published Tasks Quick List */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-500" />
                <span>Recently Published Course Tasks</span>
              </h3>

              <div className="space-y-3">
                {assignments.slice(0, 6).map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 line-clamp-1">{a.title}</span>
                      <span className="text-slate-400 font-mono shrink-0 ml-2">{a.totalMarks} M</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{a.subjectCode}</span>
                      <span>Due: {formatDate(a.deadline)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {a.totalSubmissions} submitted
                      </span>
                      <Link
                        href={`/faculty/submissions/${a.id}`}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                      >
                        <span>Submissions →</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
