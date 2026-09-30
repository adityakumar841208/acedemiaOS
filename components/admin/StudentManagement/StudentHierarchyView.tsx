"use client";

import React, { useState } from "react";
import {
  Building,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  User,
  Mail,
  Hash,
  Edit2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { StudentItem } from "./EditStudentModal";

export interface HierarchyBranch {
  branchId: string;
  branchCode: string;
  branchName: string;
  status: string;
  isActive: boolean;
  totalStudents: number;
  semesters: Array<{
    semester: number;
    label: string;
    studentCount: number;
    students: StudentItem[];
  }>;
}

interface StudentHierarchyViewProps {
  branches: HierarchyBranch[];
  loading: boolean;
  onEditStudent: (student: StudentItem) => void;
}

export default function StudentHierarchyView({
  branches,
  loading,
  onEditStudent,
}: StudentHierarchyViewProps) {
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    branches.forEach((b) => {
      initial[b.branchId] = true;
    });
    return initial;
  });

  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});

  const toggleBranch = (branchId: string) => {
    setExpandedBranches((prev) => ({
      ...prev,
      [branchId]: !prev[branchId],
    }));
  };

  const toggleSemester = (branchId: string, semNum: number) => {
    const key = `${branchId}-sem-${semNum}`;
    setExpandedSemesters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    const allB: Record<string, boolean> = {};
    const allS: Record<string, boolean> = {};
    branches.forEach((b) => {
      allB[b.branchId] = true;
      b.semesters.forEach((s) => {
        allS[`${b.branchId}-sem-${s.semester}`] = true;
      });
    });
    setExpandedBranches(allB);
    setExpandedSemesters(allS);
  };

  const collapseAll = () => {
    setExpandedBranches({});
    setExpandedSemesters({});
  };

  if (loading && branches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-slate-700">Loading student academic hierarchy...</p>
        <p className="text-xs text-slate-400 mt-1">Generating Branch → Semester → Students structure</p>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="font-bold text-slate-700 text-base">No Branches or Students Available</p>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Ensure branches are created in Branch Management. When students register or are enrolled, they will appear organized by Branch and Semester.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hierarchy Controls */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="font-semibold text-slate-700">Academic Tree:</span>
          <span>Branch</span>
          <span>&rarr;</span>
          <span>Semester</span>
          <span>&rarr;</span>
          <span>Students</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Branches List */}
      <div className="space-y-3">
        {branches.map((branch) => {
          const isBranchExpanded = expandedBranches[branch.branchId] ?? true;

          return (
            <div
              key={branch.branchId}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
            >
              {/* Branch Header */}
              <div
                onClick={() => toggleBranch(branch.branchId)}
                className="px-5 py-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 hover:text-slate-600">
                    {isBranchExpanded ? (
                      <ChevronDown className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                    {branch.branchCode}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {branch.branchName}
                      </h3>
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        {branch.branchCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{branch.semesters.length} Active Semesters</span>
                      <span>•</span>
                      <span>{branch.totalStudents} Enrolled Students</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      branch.totalStudents > 0
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {branch.totalStudents} {branch.totalStudents === 1 ? "Student" : "Students"}
                  </span>
                </div>
              </div>

              {/* Branch Content: Semesters */}
              {isBranchExpanded && (
                <div className="p-4 sm:p-5 space-y-3 bg-white">
                  {branch.semesters.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs italic">
                      No students enrolled in {branch.branchCode} department yet.
                    </div>
                  ) : (
                    branch.semesters.map((sem) => {
                      const semKey = `${branch.branchId}-sem-${sem.semester}`;
                      const isSemExpanded = expandedSemesters[semKey] ?? true;

                      return (
                        <div
                          key={sem.semester}
                          className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/30"
                        >
                          {/* Semester Bar */}
                          <div
                            onClick={() => toggleSemester(branch.branchId, sem.semester)}
                            className="px-4 py-2.5 bg-slate-100/60 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-200/60"
                          >
                            <div className="flex items-center gap-2.5">
                              {isSemExpanded ? (
                                <FolderOpen className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Folder className="w-4 h-4 text-amber-500" />
                              )}
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                {sem.label}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.2 rounded-full">
                                {sem.studentCount} {sem.studentCount === 1 ? "student" : "students"}
                              </span>
                            </div>

                            <button className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                              <span>{isSemExpanded ? "Collapse" : "Expand"}</span>
                              {isSemExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Students List in Semester */}
                          {isSemExpanded && (
                            <div className="p-3 divide-y divide-slate-100">
                              {sem.students.map((student) => {
                                const statusPills = {
                                  ACTIVE: {
                                    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                    icon: CheckCircle2,
                                  },
                                  PENDING: {
                                    bg: "bg-amber-50 text-amber-700 border-amber-200",
                                    icon: Clock,
                                  },
                                  SUSPENDED: {
                                    bg: "bg-rose-50 text-rose-700 border-rose-200",
                                    icon: XCircle,
                                  },
                                  REJECTED: {
                                    bg: "bg-slate-100 text-slate-600 border-slate-200",
                                    icon: AlertTriangle,
                                  },
                                };
                                const pill =
                                  statusPills[student.status as keyof typeof statusPills] ||
                                  statusPills.ACTIVE;
                                const PillIcon = pill.icon;

                                return (
                                  <div
                                    key={student.id}
                                    className="py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white rounded-lg transition-colors group"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                                        {student.name ? student.name[0].toUpperCase() : "S"}
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                                            {student.name}
                                          </span>
                                          {student.rollNumber && (
                                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                              {student.rollNumber}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1 truncate mt-0.5">
                                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">{student.email}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${pill.bg}`}
                                      >
                                        <PillIcon className="w-3 h-3" />
                                        <span>{student.status}</span>
                                      </span>

                                      <button
                                        onClick={() => onEditStudent(student)}
                                        title="Edit Student Record"
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
