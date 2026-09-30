"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  GraduationCap,
  Mail,
  Lock,
  User,
  Hash,
  Building,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export interface StudentItem {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "CR";
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  department?: string;
  branchId?: string;
  branch?: {
    _id: string;
    name: string;
    code: string;
  } | null;
  semester: number;
  rollNumber?: string | null;
  createdAt: string;
}

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit: StudentItem | null;
  onSuccess: () => void;
  branches: Array<{ _id: string; name: string; code: string }>;
}

export default function EditStudentModal({
  isOpen,
  onClose,
  studentToEdit,
  onSuccess,
  branches,
}: EditStudentModalProps) {
  const isEditing = Boolean(studentToEdit);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState(1);
  const [rollNumber, setRollNumber] = useState("");
  const [status, setStatus] = useState<"PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED">("ACTIVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name || "");
      setEmail(studentToEdit.email || "");
      setPassword("");
      setBranchId(studentToEdit.branchId || studentToEdit.branch?._id || branches[0]?._id || "");
      setSemester(studentToEdit.semester || 1);
      setRollNumber(studentToEdit.rollNumber || "");
      setStatus(studentToEdit.status || "ACTIVE");
      setRejectionReason("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setBranchId(branches[0]?._id || "");
      setSemester(1);
      setRollNumber("");
      setStatus("ACTIVE");
      setRejectionReason("");
    }
  }, [studentToEdit, isOpen, branches]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing) {
      if (!name.trim()) {
        toast.error("Student name is required");
        return;
      }
      if (!email.trim()) {
        toast.error("Email address is required");
        return;
      }
      if (!password || password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (!branchId) {
        toast.error("Please assign an academic branch");
        return;
      }
    }

    try {
      setSubmitting(true);

      if (isEditing && studentToEdit) {
        const payload: Record<string, any> = {
          status,
          semester: Number(semester),
          branchId,
          rollNumber: rollNumber.trim() || undefined,
        };

        if (status === "REJECTED" && rejectionReason.trim()) {
          payload.rejectionReason = rejectionReason.trim();
        }

        const res = await fetch(`/api/admin/students/${studentToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update student");

        toast.success(data.message || "Student record updated successfully!");
      } else {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          branchId,
          semester: Number(semester),
          rollNumber: rollNumber.trim() || undefined,
          status,
        };

        const res = await fetch("/api/admin/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create student");

        toast.success(data.message || "Student account created successfully!");
      }

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
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Edit Student Record" : "Enroll New Student"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Update academic affiliation, status, or roll number"
                  : "Register student into branch & semester hierarchy"}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEditing ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Patel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="student@acedemiaos.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-800 text-sm">{studentToEdit?.name}</div>
              <div className="text-slate-500">{studentToEdit?.email}</div>
              <div className="text-[11px] text-slate-400">
                Registered on: {new Date(studentToEdit?.createdAt || "").toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Academic Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Academic Branch / Department <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                required
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              >
                <option value="">Select Branch...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Semester & Roll Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Semester (1 - 8) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Roll Number
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Auto-assigned if empty"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED")
              }
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
            >
              <option value="ACTIVE">ACTIVE (Authorized to attend courses & submit)</option>
              <option value="PENDING">PENDING (Awaiting admin approval)</option>
              <option value="SUSPENDED">SUSPENDED (Temporarily locked)</option>
              <option value="REJECTED">REJECTED (Enrollment denied)</option>
            </select>
          </div>

          {status === "REJECTED" && (
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Rejection Reason</span>
              </label>
              <textarea
                rows={2}
                placeholder="Explain reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-rose-50 border border-rose-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all"
              />
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
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? "Update Student" : "Enroll Student"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
