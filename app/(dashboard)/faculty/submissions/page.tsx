"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUserSession } from "@/context/UserContext";
import {
  Award,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  ChevronRight,
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EnrichedAssignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  moduleId: string;
  moduleTitle: string;
  departmentId: string;
  semesterNumber: number;
  facultyId: string;
  facultyName: string;
  totalMarks: number;
  deadline: string;
  allowLate: boolean;
  totalSubmissions: number;
  pendingCount: number;
  evaluatedCount: number;
  lateCount: number;
  averageScore: number;
  progressPercentage: number;
  isPastDeadline: boolean;
  evaluationStatus: "NO_SUBMISSIONS" | "PENDING_EVALUATION" | "FULLY_EVALUATED";
}

type FilterTab = "ALL" | "PENDING" | "EVALUATED" | "EMPTY" | "CLOSED";
type SortOption = "PENDING_DESC" | "DEADLINE_ASC" | "CREATED_DESC";

export default function FacultyAssignmentSelectionPage() {
  const { user, isFaculty, isAdmin } = useUserSession();

  const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("PENDING_DESC");

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
        console.error("Failed to load assignments", err);
      } finally {
        setLoading(false);
      }
    }
    loadAssignments();
  }, []);

  // Filter and Sort assignments
  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        // Tab Filters
        if (activeTab === "PENDING" && a.pendingCount === 0) return false;
        if (activeTab === "EVALUATED" && (a.totalSubmissions === 0 || a.pendingCount > 0)) return false;
        if (activeTab === "EMPTY" && a.totalSubmissions > 0) return false;
        if (activeTab === "CLOSED" && !a.isPastDeadline) return false;

        // Subject Filter
        if (selectedSubject !== "ALL" && a.subjectCode !== selectedSubject) return false;

        // Semester Filter
        if (selectedSemester !== "ALL" && String(a.semesterNumber) !== selectedSemester) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            a.title.toLowerCase().includes(q) ||
            a.subjectName.toLowerCase().includes(q) ||
            a.subjectCode.toLowerCase().includes(q) ||
            a.facultyName.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "PENDING_DESC") {
          return b.pendingCount - a.pendingCount;
        }
        if (sortOption === "DEADLINE_ASC") {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        return b.id.localeCompare(a.id);
      });
  }, [assignments, activeTab, selectedSubject, selectedSemester, searchQuery, sortOption]);

  // Unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      if (a.subjectCode) set.add(a.subjectCode);
    });
    return Array.from(set);
  }, [assignments]);

  // Summary Metrics
  const totalSubmissionsAcrossAll = assignments.reduce((acc, a) => acc + a.totalSubmissions, 0);
  const totalPendingAcrossAll = assignments.reduce((acc, a) => acc + a.pendingCount, 0);
  const totalEvaluatedAcrossAll = assignments.reduce((acc, a) => acc + a.evaluatedCount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner & Context */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
              <Award className="w-4 h-4 text-amber-600" />
              <span>FACULTY EVALUATION PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Grade Submissions & Assignment Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Select an assignment below to evaluate student code, review automated plagiarism analyses, and publish final marks and feedback.
            </p>
          </div>

          <Link
            href="/faculty/assignments"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <span>+ Create New Assignment</span>
          </Link>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Coursework</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{assignments.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across Semester 3 CSE</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pending Grading</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-900 mt-1">{totalPendingAcrossAll}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Awaiting instructor marks</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Evaluated</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-900 mt-1">{totalEvaluatedAcrossAll}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Grades & feedback published</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <div className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">Total Received</div>
            <div className="text-xl sm:text-2xl font-bold text-indigo-900 mt-1">{totalSubmissionsAcrossAll}</div>
            <div className="text-[11px] text-indigo-700 mt-0.5">Student submissions</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filtering Bar */}
      <div className="space-y-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === "ALL" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Assignments ({assignments.length})
          </button>

          <button

            onClick={() => setActiveTab("PENDING")}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === "PENDING" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>Pending Evaluation</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "PENDING" ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-800"}`}>
              {assignments.filter((a) => a.pendingCount > 0).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("EVALUATED")}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === "EVALUATED" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Fully Evaluated ({assignments.filter((a) => a.totalSubmissions > 0 && a.pendingCount === 0).length})
          </button>

          <button
            onClick={() => setActiveTab("EMPTY")}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === "EMPTY" ? "bg-slate-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            No Submissions ({assignments.filter((a) => a.totalSubmissions === 0).length})
          </button>

          <button
            onClick={() => setActiveTab("CLOSED")}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === "CLOSED" ? "bg-red-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Closed Coursework ({assignments.filter((a) => a.isPastDeadline).length})
          </button>
        </div>

        {/* Search, Filter Dropdowns & Sorting */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignments by title, code, or subject..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Subject filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Subjects</option>
              {uniqueSubjects.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            {/* Semester filter */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Semesters</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
            </select>

            {/* Sort filter */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="PENDING_DESC">Sort: Pending Evaluations (High → Low)</option>
              <option value="DEADLINE_ASC">Sort: Earliest Deadline</option>
              <option value="CREATED_DESC">Sort: Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignment List Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Assignments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No assignments match your current search and filter selections. Try changing your filters or search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAssignments.map((assignment) => {
            const hasPending = assignment.pendingCount > 0;
            const isCompleted = assignment.totalSubmissions > 0 && assignment.pendingCount === 0;

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-70">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                        {assignment.subjectCode}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {assignment.subjectName}
                      </span>
                      <span className="text-xs text-slate-400">• Semester {assignment.semesterNumber}</span>
                      <span className="text-xs text-slate-400">• Dept: {assignment.departmentId.replace("dept-", "").toUpperCase()}</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {assignment.title}
                    </h2>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {assignment.description}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {hasPending ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{assignment.pendingCount} Awaiting Evaluation</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>All Evaluated</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Awaiting Submissions</span>
                      </span>
                    )}

                    {assignment.isPastDeadline ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        Deadline Passed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Active Submissions
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Submissions Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Submissions Received:</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{assignment.totalSubmissions} students</div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Pending Evaluations:</span>
                    <div className={`font-bold text-sm mt-0.5 ${hasPending ? "text-amber-700" : "text-slate-900"}`}>
                      {assignment.pendingCount} students
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Evaluated & Graded:</span>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5">{assignment.evaluatedCount} students</div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Max Marks & Deadline:</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {assignment.totalMarks} Marks • {formatDate(assignment.deadline)}
                    </div>
                  </div>
                </div>

                {/* Progress visualization */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">
                      Evaluation Progress: <strong>{assignment.evaluatedCount} of {assignment.totalSubmissions} evaluated</strong>
                    </span>
                    <span className="font-bold text-slate-700">{assignment.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
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

                {/* Action Row */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>Creator: <strong>{assignment.facultyName}</strong></span>
                    {assignment.lateCount > 0 && (
                      <span className="text-red-600 font-medium ml-2">
                        ({assignment.lateCount} late submission{assignment.lateCount > 1 ? "s" : ""})
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/faculty/submissions/${assignment.id}`}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                      hasPending
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <span>Evaluate Submissions</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
