"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  Shield,
  Building,
  GraduationCap,
  Hash,
  Briefcase,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "CR" | "FACULTY" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  department?: string;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  branches?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  semester?: number | null;
  rollNumber?: string | null;
  createdAt: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: UserItem | null;
  onSuccess: () => void;
  branches: Array<{ _id: string; name: string; code: string }>;
}

export default function EditUserModal({
  isOpen,
  onClose,
  userToEdit,
  onSuccess,
  branches,
}: EditUserModalProps) {
  const [role, setRole] = useState<"STUDENT" | "CR" | "FACULTY" | "ADMIN">("STUDENT");
  const [status, setStatus] = useState<"PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED">("ACTIVE");
  const [branchId, setBranchId] = useState("");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [semester, setSemester] = useState<number | undefined>(undefined);
  const [rollNumber, setRollNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setRole(userToEdit.role);
      setStatus(userToEdit.status);
      setBranchId(userToEdit.branchId || userToEdit.branch?.id || branches[0]?._id || "");
      setSelectedBranchIds(userToEdit.branches?.map((b) => b.id) || []);
      setSemester(userToEdit.semester || undefined);
      setRollNumber(userToEdit.rollNumber || "");
    }
  }, [userToEdit, isOpen, branches]);

  if (!isOpen || !userToEdit) return null;

  const toggleBranch = (id: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const payload: Record<string, any> = {
        userId: userToEdit.id,
        role,
        status,
      };

      if (role === "FACULTY") {
        payload.branchIds = selectedBranchIds.length > 0 ? selectedBranchIds : (branchId ? [branchId] : []);
        payload.branchId = payload.branchIds[0] || branchId;
        payload.semester = null;
        payload.rollNumber = null;
      } else if (role === "STUDENT" || role === "CR") {
        payload.branchId = branchId;
        payload.semester = semester ? Number(semester) : 1;
        payload.rollNumber = rollNumber.trim() || null;
      } else if (role === "ADMIN") {
        if (branchId) payload.branchId = branchId;
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      toast.success(data.message || "User profile updated successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit User Account</h2>
              <p className="text-xs text-slate-500">
                Modify role permissions, branch affiliations, and status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-6 mt-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-slate-800 to-slate-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
            {userToEdit.name ? userToEdit.name[0].toUpperCase() : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-900 text-sm truncate">{userToEdit.name}</div>
            <div className="text-xs text-slate-500 truncate">{userToEdit.email}</div>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 uppercase">
            {userToEdit.role}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                System Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "STUDENT" | "CR" | "FACULTY" | "ADMIN")
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all font-semibold"
              >
                <option value="STUDENT">STUDENT</option>
                <option value="CR">CLASS REPRESENTATIVE (CR)</option>
                <option value="FACULTY">FACULTY</option>
                <option value="ADMIN">ADMINISTRATOR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED")
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          {/* If FACULTY: Multi-Branch Checkboxes */}
          {role === "FACULTY" ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Assigned Branches (Faculty Multi-Branch)
                </label>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.2 rounded-full">
                  {selectedBranchIds.length} Selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pt-1">
                {branches.map((b) => {
                  const isChecked = selectedBranchIds.includes(b._id);
                  return (
                    <button
                      type="button"
                      key={b._id}
                      onClick={() => toggleBranch(b._id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        isChecked
                          ? "bg-indigo-50/80 border-indigo-300 text-indigo-950"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="text-xs font-bold truncate">{b.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Branch / Department
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all"
              >
                <option value="">Select Branch...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If Student or CR: Semester & Roll Number */}
          {(role === "STUDENT" || role === "CR") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Semester (1 - 8)
                </label>
                <select
                  value={semester || 1}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Roll Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSE101"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all font-mono"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
