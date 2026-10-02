"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  AlertTriangle,
  Building,
  GraduationCap,
  Layers,
  Calendar,
  Clock,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { FacultyData, BranchOption } from "./FacultyModal";
import { formatDate } from "@/lib/utils";

interface FacultySubjectItem {
  id: string;
  facultyId: string;
  facultyName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  departmentId: string;
  branchCode: string;
  semesterNumber: number;
  status: "ACTIVE" | "REVOKED";
  assignedBy: string;
  assignedAt: string;
  revokedBy?: string;
  revokedAt?: string;
  revocationReason?: string;
}

interface SyllabusSubjectOption {
  id: string;
  code: string;
  name: string;
  credits: number;
  semesterNumber: number;
  departmentId: string;
}

interface FacultySubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: FacultyData | null;
  availableBranches: BranchOption[];
  onAssignmentChanged?: () => void;
}

export default function FacultySubjectModal({
  isOpen,
  onClose,
  faculty,
  availableBranches,
  onAssignmentChanged,
}: FacultySubjectModalProps) {
  const [assignedSubjects, setAssignedSubjects] = useState<FacultySubjectItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Cascading Selection State for Assigning a Subject
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [availableSyllabusSubjects, setAvailableSyllabusSubjects] = useState<SyllabusSubjectOption[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Initialize selected branch to faculty's first branch
  useEffect(() => {
    if (faculty && availableBranches.length > 0) {
      const defaultBranch =
        faculty.branches && faculty.branches[0]?.code
          ? faculty.branches[0].code
          : availableBranches[0].code;
      setSelectedBranch(defaultBranch);
    }
  }, [faculty, availableBranches]);

  // Load existing assigned subjects for this faculty member
  const loadFacultyAssignments = React.useCallback(async () => {
    if (!faculty) return;
    try {
      setLoadingList(true);
      const res = await fetch(`/api/admin/faculty-subjects?facultyId=${faculty.id}`);
      if (res.ok) {
        const d = await res.json();
        setAssignedSubjects(d.facultySubjects || []);
      }
    } catch (err) {
      console.error("Failed to load faculty assignments:", err);
      toast.error("Failed to load faculty subject assignments.");
    } finally {
      setLoadingList(false);
    }
  }, [faculty]);

  useEffect(() => {
    if (isOpen && faculty) {
      loadFacultyAssignments();
    }
  }, [isOpen, faculty, loadFacultyAssignments]);

  // Cascading Step 3: Fetch ONLY subjects from the active syllabus for (Branch + Semester)
  useEffect(() => {
    async function fetchSyllabusSubjects() {
      if (!selectedBranch || !selectedSemester) return;
      try {
        setLoadingSubjects(true);
        const res = await fetch(
          `/api/subjects?deptId=${encodeURIComponent(selectedBranch)}&sem=${selectedSemester}`
        );
        if (res.ok) {
          const d = await res.json();
          setAvailableSyllabusSubjects(d.subjects || []);
          if (d.subjects?.length > 0) {
            setSelectedSubjectId(d.subjects[0].id);
          } else {
            setSelectedSubjectId("");
          }
        }
      } catch (err) {
        console.error("Failed to load syllabus subjects:", err);
      } finally {
        setLoadingSubjects(false);
      }
    }

    if (showAssignForm) {
      fetchSyllabusSubjects();
    }
  }, [selectedBranch, selectedSemester, showAssignForm]);

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faculty || !selectedSubjectId || !selectedBranch || !selectedSemester) {
      toast.error("Please select branch, semester, and a valid syllabus subject.");
      return;
    }

    try {
      setAssigning(true);
      const res = await fetch("/api/admin/faculty-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: faculty.id,
          subjectId: selectedSubjectId,
          departmentId: selectedBranch,
          semesterNumber: selectedSemester,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || "Failed to assign subject");
      }

      toast.success(d.message || "Subject assigned successfully!");
      setShowAssignForm(false);
      await loadFacultyAssignments();
      if (onAssignmentChanged) onAssignmentChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign subject.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRevokeAssignment = async (assignment: FacultySubjectItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to revoke teaching assignment for ${assignment.subjectName} (${assignment.branchCode} Sem ${assignment.semesterNumber})? Existing historical assignments will be preserved.`
    );
    if (!confirmed) return;

    try {
      setRevokingId(assignment.id);
      const res = await fetch(`/api/admin/faculty-subjects/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVOKED", reason: "Revoked by Super Admin" }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to revoke assignment");

      toast.success(`Revoked teaching assignment for ${assignment.subjectName}.`);
      await loadFacultyAssignments();
      if (onAssignmentChanged) onAssignmentChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke assignment.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleReactivateAssignment = async (assignment: FacultySubjectItem) => {
    try {
      setRevokingId(assignment.id);
      const res = await fetch(`/api/admin/faculty-subjects/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to reactivate assignment");

      toast.success(`Reactivated teaching assignment for ${assignment.subjectName}.`);
      await loadFacultyAssignments();
      if (onAssignmentChanged) onAssignmentChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate assignment.");
    } finally {
      setRevokingId(null);
    }
  };

  if (!isOpen || !faculty) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Manage Teaching Subjects: {faculty.name}
                </h2>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {faculty.facultyProfile?.designation || "Faculty"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {faculty.email} • {faculty.department || "Engineering"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Assigned Subjects ({assignedSubjects.length})</span>
            </div>

            <button
              type="button"
              onClick={() => setShowAssignForm((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-2xs ${
                showAssignForm
                  ? "bg-slate-200 text-slate-800"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAssignForm ? "Cancel Assignment" : "+ Assign Subject"}</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* CASCADING SUBJECT ASSIGNMENT FORM (Steps 1 to 5) */}
          {/* ========================================================================= */}
          {showAssignForm && (
            <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  Assign Subject via Academic Hierarchy
                </span>
                <span className="text-[11px] text-purple-700 font-medium">
                  Syllabus-verified Selection
                </span>
              </div>

              <form onSubmit={handleAssignSubject} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Step 1: Select Department / Branch */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Step 1: Department / Branch *
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 font-medium"
                      required
                    >
                      {availableBranches.map((b) => (
                        <option key={b._id || b.code} value={b.code}>
                          {b.code} — {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Select Semester */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Step 2: Semester *
                    </label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 font-medium"
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 3 & 4: Select Subject from Active Syllabus */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Step 3 & 4: Available Syllabus Subjects in {selectedBranch} Semester {selectedSemester} *
                  </label>
                  {loadingSubjects ? (
                    <div className="p-3 text-center text-slate-400 border border-slate-200 rounded-xl bg-white">
                      <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-purple-600" />
                      <span>Checking active syllabus for {selectedBranch} Semester {selectedSemester}...</span>
                    </div>
                  ) : availableSyllabusSubjects.length === 0 ? (
                    <div className="p-3 text-center text-amber-800 bg-amber-50 border border-amber-200 rounded-xl font-medium">
                      No subjects are defined in the syllabus for {selectedBranch} Semester {selectedSemester}.
                    </div>
                  ) : (
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 font-medium"
                      required
                    >
                      {availableSyllabusSubjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code}: {sub.name} ({sub.credits} Credits)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Step 5: Assign Submit */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={assigning || loadingSubjects || availableSyllabusSubjects.length === 0}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all disabled:opacity-50 shadow-sm"
                  >
                    {assigning ? "Assigning Subject..." : "Assign Subject to Faculty"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CURRENTLY ASSIGNED SUBJECTS LIST */}
          {/* ========================================================================= */}
          {loadingList ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
              <span>Loading assigned academic subjects...</span>
            </div>
          ) : assignedSubjects.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No subjects currently assigned</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Use &quot;+ Assign Subject&quot; above to grant teaching authorization for curriculum subjects.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedSubjects.map((item) => {
                const isActive = item.status === "ACTIVE";
                const isProcessing = revokingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                        : "bg-slate-50/80 border-slate-200 opacity-75"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono">
                          {item.branchCode} • Semester {item.semesterNumber}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {item.subjectName}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({item.subjectCode})
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>
                          Assigned by: <strong>{item.assignedBy}</strong> on{" "}
                          {formatDate(item.assignedAt)}
                        </span>
                        {!isActive && item.revokedAt && (
                          <span className="text-rose-700">
                            • Revoked on: {formatDate(item.revokedAt)}{" "}
                            {item.revokedBy ? `(${item.revokedBy})` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="self-end sm:self-center shrink-0">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => handleRevokeAssignment(item)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? "Revoking..." : "Revoke Assignment"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivateAssignment(item)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? "Reactivating..." : "Reactivate"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <span>Teaching authorization controls assignment publishing for this faculty member.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
