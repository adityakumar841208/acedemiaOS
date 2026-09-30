"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FolderTree,
  Table as TableIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import AdminNavigation from "../AdminNavigation";
import StudentHierarchyView, { HierarchyBranch } from "./StudentHierarchyView";
import StudentTableView from "./StudentTableView";
import EditStudentModal, { StudentItem } from "./EditStudentModal";

export default function StudentManagement() {
  const [viewMode, setViewMode] = useState<"hierarchy" | "table">("hierarchy");
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Branches list for dropdowns
  const [branches, setBranches] = useState<Array<{ _id: string; name: string; code: string }>>([]);

  // Hierarchy Data
  const [hierarchyBranches, setHierarchyBranches] = useState<HierarchyBranch[]>([]);

  // Flat List Data
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Counts summary
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    rejected: 0,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentItem | null>(null);

  // Fetch branches once
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches || []);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch hierarchy or flat list based on viewMode
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (branchFilter !== "ALL") params.set("branchId", branchFilter);
      if (semesterFilter !== "ALL") params.set("semester", semesterFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      if (viewMode === "hierarchy") {
        params.set("view", "hierarchy");
        const res = await fetch(`/api/admin/students?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setHierarchyBranches(data.branches || []);
          let total = 0;
          data.branches?.forEach((b: HierarchyBranch) => {
            total += b.totalStudents;
          });
          setCounts((prev) => ({ ...prev, total }));
        } else {
          toast.error("Failed to load student hierarchy");
        }
      } else {
        params.set("view", "list");
        params.set("page", page.toString());
        params.set("limit", "15");
        const res = await fetch(`/api/admin/students?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotalCount(data.pagination.total || 0);
          }
          if (data.counts) {
            setCounts(data.counts);
          }
        } else {
          toast.error("Failed to load students list");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [viewMode, search, branchFilter, semesterFilter, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const openCreateModal = () => {
    setStudentToEdit(null);
    setModalOpen(true);
  };

  const openEditModal = (student: StudentItem) => {
    setStudentToEdit(student);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Navigation */}
      <AdminNavigation />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>INSTITUTIONAL ENROLLMENT SYSTEM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Student Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse and organize all students in an academic hierarchy (Branch &rarr; Semester &rarr; Students) or flat directory.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll Student</span>
        </button>
      </div>

      {/* Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Students</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {counts.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Enrolled across branches</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Active Enrolled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
            {counts.active || counts.total}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Full course access</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
            {counts.pending}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Awaiting verification</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Suspended / Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">
            {(counts.suspended || 0) + (counts.rejected || 0)}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Access disabled</div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Top row: View switcher & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setViewMode("hierarchy")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 md:flex-initial justify-center ${
                viewMode === "hierarchy"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>Hierarchy View (Branch &rarr; Semester)</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 md:flex-initial justify-center ${
                viewMode === "table"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Directory Table</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Second row: Dropdown filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </span>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-700"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.code} - {b.name}
              </option>
            ))}
          </select>

          {/* Semester Filter */}
          <select
            value={semesterFilter}
            onChange={(e) => {
              setSemesterFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-700"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={() => fetchData()}
            title="Refresh student records"
            className="ml-auto p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {viewMode === "hierarchy" ? (
        <StudentHierarchyView
          branches={hierarchyBranches}
          loading={loading}
          onEditStudent={openEditModal}
        />
      ) : (
        <StudentTableView
          students={students}
          loading={loading}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          onEditStudent={openEditModal}
        />
      )}

      {/* Edit / Enroll Student Modal */}
      <EditStudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        studentToEdit={studentToEdit}
        onSuccess={fetchData}
        branches={branches}
      />
    </div>
  );
}
