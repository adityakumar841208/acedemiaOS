"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Building,
  Mail,
  Edit2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Phone,
  MapPin,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import FacultyModal, { FacultyData, BranchOption } from "./FacultyModal";
import AdminNavigation from "../AdminNavigation";

export default function FacultyManagement() {
  const [facultyList, setFacultyList] = useState<FacultyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [availableBranches, setAvailableBranches] = useState<BranchOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [facultyToEdit, setFacultyToEdit] = useState<FacultyData | null>(null);

  // Fetch branches for filter
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          setAvailableBranches(data.branches || []);
        }
      } catch (err) {
        console.error("Failed to load branches filter:", err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch faculty list from MongoDB
  const fetchFaculty = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (branchFilter !== "ALL") params.set("branchId", branchFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "10");

      const res = await fetch(`/api/admin/faculty?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFacultyList(data.faculty || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      } else {
        toast.error("Failed to load faculty list");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [search, branchFilter, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFaculty();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchFaculty]);

  const handleToggleStatus = async (faculty: FacultyData) => {
    const newStatus = faculty.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/faculty/${faculty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");

      toast.success(
        `Faculty member ${faculty.name} is now ${newStatus.toLowerCase()}!`
      );
      fetchFaculty();
    } catch (err: any) {
      toast.error(err.message || "Failed to update faculty status");
    }
  };

  const openCreateModal = () => {
    setFacultyToEdit(null);
    setModalOpen(true);
  };

  const openEditModal = (faculty: FacultyData) => {
    setFacultyToEdit(faculty);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Navigation */}
      <AdminNavigation />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
            <Briefcase className="w-4 h-4" />
            <span>ACADEMIC FACULTY DIRECTORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Faculty Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision faculty accounts, manage multi-branch department affiliations, and regulate teaching privileges.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Faculty</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by faculty name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
          />
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-48 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-medium text-slate-700"
          >
            <option value="ALL">All Branches</option>
            {availableBranches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.code} - {b.name}
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
            className="w-full md:w-36 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <button
            onClick={() => fetchFaculty()}
            title="Refresh faculty list"
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Faculty List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Assigned Branches</th>
                <th className="py-3.5 px-4">Office & Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && facultyList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading faculty members from database...</span>
                  </td>
                </tr>
              ) : facultyList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No faculty members found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || branchFilter !== "ALL" || statusFilter !== "ALL"
                        ? "Try clearing search or filter parameters."
                        : "Click 'Create Faculty' to provision your first faculty account."}
                    </p>
                  </td>
                </tr>
              ) : (
                facultyList.map((faculty) => {
                  const isActive = faculty.status === "ACTIVE";
                  return (
                    <tr
                      key={faculty.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {faculty.name ? faculty.name[0].toUpperCase() : "F"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{faculty.name}</span>
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                                {faculty.facultyProfile?.designation || "Assistant Professor"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{faculty.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Multi-Branch Badges */}
                      <td className="py-3.5 px-4">
                        {faculty.branches && faculty.branches.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {faculty.branches.map((b) => (
                              <span
                                key={b.id || b.code}
                                title={b.name}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                              >
                                <Building className="w-3 h-3 text-indigo-500" />
                                <span>{b.code}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {faculty.department || "No branches assigned"}
                          </span>
                        )}
                      </td>

                      {/* Office & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          {faculty.facultyProfile?.officeLocation ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{faculty.facultyProfile.officeLocation}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No office specified</span>
                          )}
                          {faculty.facultyProfile?.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{faculty.facultyProfile.phone}</span>
                            </div>
                          )}
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
                          <span>{faculty.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(faculty)}
                            title="Edit Faculty Member"
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(faculty)}
                            title={isActive ? "Suspend Faculty" : "Activate Faculty"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActive
                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4" />
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-800">{page}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalPages}</span> ({totalCount} total faculty)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <FacultyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        facultyToEdit={facultyToEdit}
        onSuccess={fetchFaculty}
      />
    </div>
  );
}
