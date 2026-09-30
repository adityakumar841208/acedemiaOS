"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building,
  Plus,
  Search,
  GraduationCap,
  Briefcase,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import BranchModal, { BranchData } from "./BranchModal";
import AdminNavigation from "../AdminNavigation";

interface BranchItem {
  id: string;
  name: string;
  code: string;
  status: "ACTIVE" | "INACTIVE";
  isActive?: boolean;
  description: string;
  hodName: string;
  studentCount: number;
  facultyCount: number;
  crCount: number;
  totalUsers: number;
  createdAt: string;
}

export default function BranchManagement() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchItem | null>(null);

  // Deletion confirmation
  const [branchToDelete, setBranchToDelete] = useState<BranchItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/branches?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      } else {
        toast.error("Failed to load branches");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBranches();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchBranches]);

  const handleToggleStatus = async (branch: BranchItem) => {
    const newStatus = branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");

      toast.success(
        `Branch ${branch.code} ${newStatus === "ACTIVE" ? "activated" : "deactivated"}!`
      );
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message || "Failed to update branch status");
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/branches/${branchToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete branch");

      toast.success(data.message || "Branch deleted successfully.");
      setBranchToDelete(null);
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message || "Deletion failed");
    } finally {
      setDeleting(false);
    }
  };

  const openCreateModal = () => {
    setBranchToEdit(null);
    setModalOpen(true);
  };

  const openEditModal = (branch: BranchItem) => {
    setBranchToEdit(branch);
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
            <Building className="w-4 h-4" />
            <span>CENTRAL ACADEMIC STRUCTURE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Branch & Department Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure academic branches dynamically in MongoDB without hardcoding application code.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Branch</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search branches by code, name, or HOD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            onClick={() => fetchBranches()}
            title="Refresh branches list"
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Head of Department</th>
                <th className="py-3.5 px-4 text-center">Students</th>
                <th className="py-3.5 px-4 text-center">Faculty</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && branches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading branches from database...</span>
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No branches found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click 'Add Branch' to define your first academic department.
                    </p>
                  </td>
                </tr>
              ) : (
                branches.map((branch) => {
                  const isActive = branch.status === "ACTIVE";
                  return (
                    <tr
                      key={branch.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name & Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {branch.code.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 truncate">
                              {branch.name}
                            </div>
                            {branch.description ? (
                              <div className="text-xs text-slate-400 truncate max-w-xs">
                                {branch.description}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-300 italic">
                                No description provided
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                          {branch.code}
                        </span>
                      </td>

                      {/* HOD */}
                      <td className="py-3.5 px-4">
                        {branch.hodName ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium">{branch.hodName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not assigned</span>
                        )}
                      </td>

                      {/* Students Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                          <span>{branch.studentCount}</span>
                        </span>
                      </td>

                      {/* Faculty Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                          <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                          <span>{branch.facultyCount}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(branch)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          title={`Click to ${isActive ? "deactivate" : "activate"}`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-500" />
                          )}
                          <span>{branch.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(branch)}
                            title="Edit Branch"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setBranchToDelete(branch)}
                            title="Delete Branch"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

      {/* Create / Edit Modal */}
      <BranchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        branchToEdit={branchToEdit}
        onSuccess={fetchBranches}
      />

      {/* Safe Deletion Confirmation Dialog */}
      {branchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Delete Branch {branchToDelete.code}?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently remove{" "}
                <span className="font-semibold text-slate-800">
                  {branchToDelete.name}
                </span>{" "}
                from the database?
              </p>
            </div>

            {branchToDelete.totalUsers > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Safe Deletion Warning</span>
                </div>
                <p>
                  This branch has{" "}
                  <strong>{branchToDelete.totalUsers} associated account(s)</strong> (
                  {branchToDelete.studentCount} students, {branchToDelete.facultyCount} faculty).
                  The server will reject deletion while accounts remain affiliated. Please deactivate the branch or reassign users first.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
