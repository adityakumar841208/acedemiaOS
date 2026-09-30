"use client";

import React, { useState, useEffect } from "react";
import { X, Briefcase, Mail, Lock, User, MapPin, Phone, FileText, CheckSquare, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface BranchOption {
  _id: string;
  name: string;
  code: string;
}

export interface FacultyData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING" | "REJECTED";
  department?: string;
  branches: Array<{ id: string; name: string; code: string }>;
  facultyProfile?: {
    designation?: string;
    title?: string;
    officeLocation?: string;
    phone?: string;
    bio?: string;
  };
}

interface FacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyToEdit: FacultyData | null;
  onSuccess: () => void;
}

export default function FacultyModal({
  isOpen,
  onClose,
  facultyToEdit,
  onSuccess,
}: FacultyModalProps) {
  const isEditing = Boolean(facultyToEdit);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [designation, setDesignation] = useState("Assistant Professor");
  const [officeLocation, setOfficeLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");

  const [availableBranches, setAvailableBranches] = useState<BranchOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadBranches = async () => {
      try {
        setLoadingBranches(true);
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          setAvailableBranches(data.branches || []);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, [isOpen]);

  useEffect(() => {
    if (facultyToEdit) {
      setName(facultyToEdit.name || "");
      setEmail(facultyToEdit.email || "");
      setPassword("");
      setStatus(facultyToEdit.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE");
      setDesignation(facultyToEdit.facultyProfile?.designation || "Assistant Professor");
      setOfficeLocation(facultyToEdit.facultyProfile?.officeLocation || "");
      setPhone(facultyToEdit.facultyProfile?.phone || "");
      setBio(facultyToEdit.facultyProfile?.bio || "");

      const branchIds = facultyToEdit.branches?.map((b) => b.id) || [];
      setSelectedBranchIds(branchIds);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setStatus("ACTIVE");
      setDesignation("Assistant Professor");
      setOfficeLocation("");
      setPhone("");
      setBio("");
      setSelectedBranchIds([]);
    }
  }, [facultyToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleBranch = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Faculty name is required");
      return;
    }

    if (!isEditing) {
      if (!email.trim()) {
        toast.error("Email address is required");
        return;
      }
      if (!password || password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    if (selectedBranchIds.length === 0) {
      toast.error("Please assign at least one department/branch");
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && facultyToEdit) {
        const payload = {
          name: name.trim(),
          status,
          branchIds: selectedBranchIds,
          facultyProfile: {
            designation: designation.trim(),
            title: designation.trim(),
            officeLocation: officeLocation.trim(),
            phone: phone.trim(),
            bio: bio.trim(),
          },
        };

        const res = await fetch(`/api/admin/faculty/${facultyToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update faculty profile");
        }

        toast.success(data.message || "Faculty updated successfully!");
      } else {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          branchIds: selectedBranchIds,
          designation: designation.trim(),
          title: designation.trim(),
          officeLocation: officeLocation.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
          status,
        };

        const res = await fetch("/api/admin/faculty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create faculty member");
        }

        toast.success(data.message || "Faculty account created successfully!");
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Edit Faculty Member" : "Create New Faculty Member"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Update academic affiliations and profile details"
                  : "Provision a new faculty account with multi-branch assignments"}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  disabled={isEditing}
                  placeholder="faculty@acedemiaos.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Initial Account Password <span className="text-rose-500">*</span>
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
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Password will be securely hashed with bcrypt. Faculty can update this later.
              </p>
            </div>
          )}

          {/* Multi-Branch Assignment (Checkboxes) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Assigned Branches / Departments <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Faculty can be affiliated with multiple branches. Select all that apply.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                {selectedBranchIds.length} Selected
              </span>
            </div>

            {loadingBranches ? (
              <div className="py-4 flex items-center justify-center text-xs text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Loading available branches from database...</span>
              </div>
            ) : availableBranches.length === 0 ? (
              <p className="text-xs text-amber-600 py-2">
                No active branches found. Please create branches first in Branch Management.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                {availableBranches.map((branch) => {
                  const isChecked = selectedBranchIds.includes(branch._id);
                  return (
                    <button
                      type="button"
                      key={branch._id}
                      onClick={() => toggleBranch(branch._id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? "bg-purple-50/80 border-purple-300 text-purple-950 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                      </div>
                      <div className="truncate flex-1">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{branch.code}</span>
                          {isChecked && (
                            <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-semibold">
                              Assigned
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {branch.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Academic Designation & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Designation / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Associate Professor, HOD"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "SUSPENDED")}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-semibold"
              >
                <option value="ACTIVE">ACTIVE (Authorized to teach & grade)</option>
                <option value="SUSPENDED">SUSPENDED (Access locked)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Office / Cabin Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Block C, Room 304"
                  value={officeLocation}
                  onChange={(e) => setOfficeLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone / Ext.
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Faculty Biography / Specialization
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                placeholder="Specializations, research focus, or teaching experience..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
          </div>

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
              disabled={submitting || selectedBranchIds.length === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? "Save Changes" : "Create Faculty"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
