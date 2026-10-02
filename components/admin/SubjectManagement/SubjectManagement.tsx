"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Building,
  GraduationCap,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  Check,
  X,
  ChevronRight,
  FolderOpen,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import AdminNavigation from "../AdminNavigation";

interface BranchOption {
  _id: string;
  code: string;
  name: string;
}

interface CurriculumModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  topics?: string[];
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  semesterNumber: number;
  departmentId: string;
  branchCode?: string;
  description?: string;
  isActive?: boolean;
  facultyName?: string;
  modules?: CurriculumModule[];
}

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    branchCode: "CSE",
    semesterNumber: 3,
    credits: 4,
    description: "",
    isActive: true,
  });

  const [formModules, setFormModules] = useState<
    Array<{ title: string; description: string; topics: string }>
  >([]);

  // Fetch Branches
  useEffect(() => {
    async function loadBranches() {
      try {
        setLoadingBranches(true);
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches || []);
          if (data.branches?.length > 0) {
            setFormData((prev) =>
              prev.branchCode ? prev : { ...prev, branchCode: data.branches[0].code }
            );
          }
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      } finally {
        setLoadingBranches(false);
      }
    }
    loadBranches();
  }, []);

  // Fetch Subjects
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBranch !== "ALL") params.set("deptId", selectedBranch);
      if (selectedSemester !== "ALL") params.set("sem", selectedSemester);

      const res = await fetch(`/api/subjects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      } else {
        toast.error("Failed to load subjects");
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedSemester]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      code: "",
      name: "",
      branchCode: selectedBranch !== "ALL" ? selectedBranch : branches[0]?.code || "CSE",
      semesterNumber: selectedSemester !== "ALL" ? Number(selectedSemester) : 1,
      credits: 4,
      description: "",
      isActive: true,
    });
    setFormModules([
      { title: "Unit 1: Introduction & Fundamentals", description: "Core concepts and principles", topics: "Basic Concepts, History, Terminology" },
      { title: "Unit 2: Architecture & Advanced Methods", description: "Design paradigms and methodologies", topics: "System Architecture, Performance" },
    ]);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sub: SubjectItem) => {
    setEditingSubject(sub);
    const branch = sub.branchCode || sub.departmentId.replace(/^(dept-|department-)/i, "").toUpperCase();
    setFormData({
      code: sub.code,
      name: sub.name,
      branchCode: branch,
      semesterNumber: sub.semesterNumber,
      credits: sub.credits || 4,
      description: sub.description || "",
      isActive: sub.isActive !== false,
    });
    setFormModules(
      (sub.modules && sub.modules.length > 0)
        ? sub.modules.map((m) => ({
            title: m.title,
            description: m.description || "",
            topics: m.topics ? m.topics.join(", ") : "",
          }))
        : []
    );
    setIsAddModalOpen(true);
  };

  // Save Subject (POST or PATCH)
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || !formData.branchCode) {
      toast.error("Subject code, name, and branch are required.");
      return;
    }

    const formattedModules = formModules.map((m, idx) => ({
      id: `mod-${idx + 1}-${Date.now()}`,
      title: m.title,
      description: m.description,
      order: idx + 1,
      topics: m.topics.split(",").map((t) => t.trim()).filter(Boolean),
    }));

    try {
      if (editingSubject) {
        // Update existing subject
        const res = await fetch(`/api/subjects/${editingSubject.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            credits: formData.credits,
            description: formData.description,
            isActive: formData.isActive,
            modules: formattedModules,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update subject");

        toast.success(`Updated subject ${formData.code} - ${formData.name}`);
      } else {
        // Create new subject
        const res = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            branchCode: formData.branchCode,
            semesterNumber: Number(formData.semesterNumber),
            credits: Number(formData.credits),
            description: formData.description.trim(),
            modules: formattedModules,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create subject");

        toast.success(`Created subject ${formData.code.toUpperCase()} successfully!`);
      }

      setIsAddModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  // Toggle active/deactivate
  const handleToggleActive = async (sub: SubjectItem) => {
    const nextState = sub.isActive === false;
    try {
      const res = await fetch(`/api/subjects/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");

      toast.success(
        nextState
          ? `Activated subject ${sub.code}`
          : `Deactivated subject ${sub.code}`
      );
      fetchSubjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle subject status");
    }
  };

  // Filter in memory for search and status
  const filteredSubjects = subjects.filter((sub) => {
    const matchesSearch =
      search === "" ||
      sub.code.toLowerCase().includes(search.toLowerCase()) ||
      sub.name.toLowerCase().includes(search.toLowerCase());

    const isSubActive = sub.isActive !== false;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && isSubActive) ||
      (statusFilter === "INACTIVE" && !isSubActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <AdminNavigation />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>ACADEMIC CURRICULUM DIRECTORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Subject & Curriculum Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage subjects strictly scoped by Branch and Semester. Configure credits, syllabus modules, and course definitions.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Academic Hierarchy Scoping Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Branch Selection Pills */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            <span>Select Branch / Department:</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setSelectedBranch("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedBranch === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Branches
            </button>
            {branches.map((b) => (
              <button
                key={b._id}
                onClick={() => setSelectedBranch(b.code)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedBranch === b.code
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {b.code} ({b.name})
              </button>
            ))}
          </div>
        </div>

        {/* Semester Selection Pills */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Select Semester:</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setSelectedSemester("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedSemester === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Semesters
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem.toString())}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedSemester === sem.toString()
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semester {sem}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by subject code (e.g. CS301) or name (e.g. Database)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated</option>
            </select>

            <button
              onClick={() => fetchSubjects()}
              title="Refresh subjects"
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Subjects Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Curriculum Catalog ({filteredSubjects.length} subjects found)
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Scope: {selectedBranch === "ALL" ? "All Branches" : selectedBranch} •{" "}
            {selectedSemester === "ALL" ? "All Semesters" : `Semester ${selectedSemester}`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Academic Scope</th>
                <th className="py-3.5 px-4">Credits</th>
                <th className="py-3.5 px-4">Modules</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading curriculum subjects from database...</span>
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No subjects found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || selectedBranch !== "ALL" || selectedSemester !== "ALL"
                        ? "Try clearing filters or search query."
                        : "Click 'Add New Subject' to define your first curriculum course."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((sub) => {
                  const branch =
                    sub.branchCode ||
                    sub.departmentId?.replace(/^(dept-|department-)/i, "").toUpperCase();
                  const isActive = sub.isActive !== false;
                  const moduleCount = sub.modules?.length || 0;

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isActive ? "opacity-60 bg-slate-50/40" : ""
                      }`}
                    >
                      {/* Subject Name and Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                            {sub.code}
                          </span>
                          <span>{sub.name}</span>
                        </div>
                        {sub.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {sub.description}
                          </p>
                        )}
                      </td>

                      {/* Scope: Branch + Semester */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 text-xs">
                            <Building className="w-3 h-3 text-slate-400" />
                            {branch}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <GraduationCap className="w-3 h-3 text-slate-400" />
                            Semester {sub.semesterNumber}
                          </span>
                        </div>
                      </td>

                      {/* Credits */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {sub.credits || 4} Credits
                        </span>
                      </td>

                      {/* Modules */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>{moduleCount} Units</span>
                        </span>
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
                          <span>{isActive ? "Active" : "Deactivated"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(sub)}
                            title="Edit Subject"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleActive(sub)}
                            title={isActive ? "Deactivate Subject" : "Activate Subject"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActive
                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
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

      {/* Add / Edit Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSubject ? `Edit Subject: ${editingSubject.code}` : "Add New Subject to Curriculum"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Branch Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Branch / Department *
                  </label>
                  <select
                    disabled={!!editingSubject}
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                  >
                    {branches.map((b) => (
                      <option key={b._id} value={b.code}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Semester *
                  </label>
                  <select
                    disabled={!!editingSubject}
                    value={formData.semesterNumber}
                    onChange={(e) => setFormData({ ...formData, semesterNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject Code (e.g. CS301) *
                  </label>
                  <input
                    type="text"
                    disabled={!!editingSubject}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CS305"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:opacity-60 uppercase font-mono font-bold"
                    required
                  />
                </div>

                {/* Credits */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Credits *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              {/* Subject Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Artificial Intelligence and Neural Networks"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Course Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief overview of course syllabus and objectives..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Active Toggle (Edit mode) */}
              {editingSubject && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Course is currently Active and Available for Faculty Assignment & Teaching
                  </label>
                </div>
              )}

              {/* Curriculum Modules Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Curriculum Syllabus Modules ({formModules.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormModules([
                        ...formModules,
                        {
                          title: `Unit ${formModules.length + 1}: Module Title`,
                          description: "",
                          topics: "",
                        },
                      ])
                    }
                    className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Unit</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {formModules.map((mod, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative group"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setFormModules(formModules.filter((_, i) => i !== idx))
                        }
                        className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Remove unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="pr-6">
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const updated = [...formModules];
                            updated[idx].title = e.target.value;
                            setFormModules(updated);
                          }}
                          placeholder={`Unit ${idx + 1} Title`}
                          className="w-full text-xs font-bold bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={mod.topics}
                          onChange={(e) => {
                            const updated = [...formModules];
                            updated[idx].topics = e.target.value;
                            setFormModules(updated);
                          }}
                          placeholder="Topics separated by comma (e.g. Trees, Graphs, Hashing)"
                          className="w-full text-xs bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingSubject ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
