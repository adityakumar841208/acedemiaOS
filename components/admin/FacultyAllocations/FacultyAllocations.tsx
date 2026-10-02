"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Award,
  BookOpen,
  Briefcase,
  Building,
  GraduationCap,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminNavigation from "../AdminNavigation";
import { formatDate } from "@/lib/utils";

interface FacultyItem {
  id: string;
  name: string;
  email: string;
  department?: string;
  branches?: Array<{ _id: string; code: string; name: string }>;
}

interface BranchItem {
  _id: string;
  code: string;
  name: string;
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  semesterNumber: number;
  departmentId: string;
}

interface AllocationItem {
  id: string;
  facultyId: string;
  facultyName: string;
  facultyEmail?: string;
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

export default function FacultyAllocations() {
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [modalBranch, setModalBranch] = useState("CSE");
  const [modalSemester, setModalSemester] = useState(3);
  const [modalSubjects, setModalSubjects] = useState<SubjectItem[]>([]);
  const [modalSubjectId, setModalSubjectId] = useState("");
  const [loadingModalSubjects, setLoadingModalSubjects] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Load Branches and Faculty for selection
  useEffect(() => {
    async function loadMeta() {
      try {
        const [branchRes, facRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/admin/faculty?limit=200"),
        ]);

        if (branchRes.ok) {
          const bData = await branchRes.json();
          setBranches(bData.branches || []);
          if (bData.branches?.length > 0) {
            setModalBranch(bData.branches[0].code);
          }
        }

        if (facRes.ok) {
          const fData = await facRes.json();
          setFacultyList(fData.faculty || []);
          if (fData.faculty?.length > 0) {
            setSelectedFacultyId(fData.faculty[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Allocations
  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (branchFilter !== "ALL") params.set("departmentId", branchFilter);
      if (semesterFilter !== "ALL") params.set("semesterNumber", semesterFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/faculty-subjects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAllocations(data.facultySubjects || []);
      } else {
        toast.error("Failed to fetch faculty subject allocations");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [branchFilter, semesterFilter, statusFilter]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  // Dynamically load subjects when branch or semester changes in Assign Modal
  useEffect(() => {
    async function fetchSubjectsForModal() {
      if (!isAssignModalOpen || !modalBranch || !modalSemester) return;
      try {
        setLoadingModalSubjects(true);
        const res = await fetch(
          `/api/subjects?deptId=${encodeURIComponent(modalBranch)}&sem=${modalSemester}`
        );
        if (res.ok) {
          const data = await res.json();
          const subs = (data.subjects || []).filter((s: any) => s.isActive !== false);
          setModalSubjects(subs);
          if (subs.length > 0) {
            setModalSubjectId(subs[0].id);
          } else {
            setModalSubjectId("");
          }
        }
      } catch (err) {
        console.error("Failed to fetch subjects for modal:", err);
      } finally {
        setLoadingModalSubjects(false);
      }
    }
    fetchSubjectsForModal();
  }, [isAssignModalOpen, modalBranch, modalSemester]);

  // Handle Create Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !modalSubjectId || !modalBranch || !modalSemester) {
      toast.error("Please fill all required allocation parameters.");
      return;
    }

    try {
      setSubmittingAssign(true);
      const res = await fetch("/api/admin/faculty-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: selectedFacultyId,
          subjectId: modalSubjectId,
          departmentId: modalBranch,
          semesterNumber: Number(modalSemester),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create assignment");
      }

      toast.success(data.message || "Faculty allocated to subject successfully!");
      setIsAssignModalOpen(false);
      fetchAllocations();
    } catch (err: any) {
      toast.error(err.message || "Failed to allocate subject");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Handle Revoke
  const handleRevoke = async (item: AllocationItem) => {
    const reason = window.prompt(
      `Enter reason for revoking ${item.facultyName} from ${item.subjectCode} - ${item.subjectName}:`,
      "Curriculum reorganization"
    );
    if (reason === null) return;

    try {
      const res = await fetch(`/api/admin/faculty-subjects/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REVOKED",
          reason: reason || "Revoked by Super Admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke assignment");

      toast.success(`Revoked teaching assignment for ${item.facultyName}.`);
      fetchAllocations();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke assignment");
    }
  };

  // Handle Reactivate
  const handleReactivate = async (item: AllocationItem) => {
    try {
      const res = await fetch(`/api/admin/faculty-subjects/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reactivate assignment");

      toast.success(`Reactivated teaching assignment for ${item.facultyName}.`);
      fetchAllocations();
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate assignment");
    }
  };

  // Handle Delete Record
  const handleDelete = async (item: AllocationItem) => {
    const confirmed = window.confirm(
      `Permanently delete allocation record for ${item.facultyName} on ${item.subjectCode}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/faculty-subjects/${item.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete record");

      toast.success("Allocation record deleted.");
      fetchAllocations();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete allocation record");
    }
  };

  // Filter in memory by search
  const filteredAllocations = allocations.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.facultyName?.toLowerCase().includes(q) ||
      item.facultyEmail?.toLowerCase().includes(q) ||
      item.subjectCode?.toLowerCase().includes(q) ||
      item.subjectName?.toLowerCase().includes(q) ||
      item.branchCode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <AdminNavigation />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Award className="w-4 h-4" />
            <span>ACADEMIC FACULTY ALLOCATIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Faculty Subject Allocations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign official teaching responsibilities linking Faculty members to specific Branch + Semester subjects.
          </p>
        </div>

        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Faculty to Subject</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by faculty name, subject code, or course title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Branch filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-700"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b.code}>
                {b.code} - {b.name}
              </option>
            ))}
          </select>

          {/* Semester filter */}
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-700"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s.toString()}>
                Semester {s}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="REVOKED">Revoked</option>
          </select>

          <button
            onClick={() => fetchAllocations()}
            title="Refresh allocations"
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Active Allocations ({filteredAllocations.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Subject Course</th>
                <th className="py-3.5 px-4">Branch & Sem</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Allocation Metadata</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading allocations from database...</span>
                  </td>
                </tr>
              ) : filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No subject allocations found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || branchFilter !== "ALL" || semesterFilter !== "ALL"
                        ? "Try clearing filters or search query."
                        : "Click 'Assign Faculty to Subject' to allocate courses to faculty."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAllocations.map((item) => {
                  const isActive = item.status === "ACTIVE";
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isActive ? "opacity-60 bg-slate-50/40" : ""
                      }`}
                    >
                      {/* Faculty */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.facultyName}</div>
                        {item.facultyEmail && (
                          <div className="text-[11px] text-slate-500">{item.facultyEmail}</div>
                        )}
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-mono font-bold">
                            {item.subjectCode}
                          </span>
                          <span>{item.subjectName}</span>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            {item.branchCode}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-slate-400" />
                            Semester {item.semesterNumber}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Metadata */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        <div>
                          Assigned by <span className="font-medium text-slate-700">{item.assignedBy}</span>
                        </div>
                        {item.assignedAt && (
                          <div className="text-[11px] text-slate-400">
                            {formatDate(item.assignedAt)}
                          </div>
                        )}
                        {item.revocationReason && (
                          <div className="text-[11px] text-rose-600 mt-0.5 italic">
                            Reason: {item.revocationReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isActive ? (
                            <button
                              onClick={() => handleRevoke(item)}
                              title="Revoke Assignment"
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(item)}
                              title="Reactivate Assignment"
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(item)}
                            title="Delete Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Assign Faculty to Subject
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
              {/* Step 1: Select Faculty Member */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Select Faculty Member *
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  required
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Branch & Semester Cascading */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Select Branch *
                  </label>
                  <select
                    value={modalBranch}
                    onChange={(e) => setModalBranch(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b._id} value={b.code}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3. Select Semester *
                  </label>
                  <select
                    value={modalSemester}
                    onChange={(e) => setModalSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
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

              {/* Step 3: Select Subject (Filtered to Branch + Semester) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>4. Select Subject (Scoped to {modalBranch} Sem {modalSemester}) *</span>
                  {loadingModalSubjects && (
                    <span className="text-[11px] text-indigo-600 font-normal flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
                    </span>
                  )}
                </label>
                <select
                  value={modalSubjectId}
                  onChange={(e) => setModalSubjectId(e.target.value)}
                  disabled={loadingModalSubjects || modalSubjects.length === 0}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium disabled:opacity-60"
                  required
                >
                  {modalSubjects.length === 0 ? (
                    <option value="">No subjects found for this branch and semester</option>
                  ) : (
                    modalSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name} ({s.credits} Credits)
                      </option>
                    ))
                  )}
                </select>
                {modalSubjects.length === 0 && !loadingModalSubjects && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    No curriculum subjects exist yet for {modalBranch} Semester {modalSemester}. Please create subjects in the Subjects tab first.
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign || !modalSubjectId}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {submittingAssign && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Assign Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
