"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Briefcase,
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  FileText,
  CheckSquare,
  Square,
  Loader2,
  BookOpen,
  Search,
  AlertCircle,
  Filter,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export interface BranchOption {
  _id: string;
  name: string;
  code: string;
}

export interface AvailableSubject {
  id: string;
  code: string;
  name: string;
  branchCode: string;
  departmentId: string;
  semesterNumber: number;
  credits: number;
  isAssignedToOther: boolean;
  isAssignedToCurrent: boolean;
  isFree: boolean;
  assignedToFacultyName: string | null;
  assignedToFacultyId: string | null;
}

export interface FacultyData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING" | "REJECTED";
  department?: string;
  branches: Array<{ id: string; name: string; code: string }>;
  assignedSubjectIds?: string[];
  assignedSubjects?: Array<{
    id: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    branchCode: string;
    semesterNumber: number;
  }>;
  assignedSubjectsCount?: number;
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
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<number | "ALL">("ALL");

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

      const initialSubIds =
        facultyToEdit.assignedSubjectIds ||
        facultyToEdit.assignedSubjects?.map((s) => s.subjectId) ||
        [];
      setSelectedSubjectIds(initialSubIds);
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
      setSelectedSubjectIds([]);
    }
  }, [facultyToEdit, isOpen]);

  // Load available subjects whenever selected branches change
  const branchIdsKey = selectedBranchIds.join(",");
  const editingFacultyId = facultyToEdit?.id || "";

  useEffect(() => {
    if (!isOpen) return;

    if (selectedBranchIds.length === 0) {
      setAvailableSubjects([]);
      setSelectedSubjectIds([]);
      return;
    }

    const loadSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const query = new URLSearchParams();
        query.set("branchIds", selectedBranchIds.join(","));
        if (editingFacultyId) {
          query.set("facultyId", editingFacultyId);
        }

        const res = await fetch(`/api/admin/faculty-subjects/available?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const subs: AvailableSubject[] = data.subjects || [];
          setAvailableSubjects(subs);

          // Synchronize selectedSubjectIds
          const validSubIds = new Set(subs.map((s) => s.id));
          if (facultyToEdit) {
            const currentAssigned = subs.filter((s) => s.isAssignedToCurrent).map((s) => s.id);
            setSelectedSubjectIds((prev) => {
              const merged = Array.from(new Set([...prev, ...currentAssigned]));
              return merged.filter((id) => validSubIds.has(id));
            });
          } else {
            setSelectedSubjectIds((prev) => prev.filter((id) => validSubIds.has(id)));
          }
        }
      } catch (err) {
        console.error("Failed to load available subjects:", err);
      } finally {
        setLoadingSubjects(false);
      }
    };

    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, branchIdsKey, editingFacultyId]);

  if (!isOpen) return null;

  const toggleBranch = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const toggleSubject = (sub: AvailableSubject) => {
    if (sub.isAssignedToOther) {
      toast.error(
        `Cannot assign ${sub.code}: It is currently assigned to ${
          sub.assignedToFacultyName || "another faculty member"
        }. Edit that teacher's profile first to release this subject.`
      );
      return;
    }

    setSelectedSubjectIds((prev) =>
      prev.includes(sub.id)
        ? prev.filter((id) => id !== sub.id)
        : [...prev, sub.id]
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
          subjectIds: selectedSubjectIds,
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
          subjectIds: selectedSubjectIds,
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
    <div className="fixed inset-0 z-50 flex min-h-dvh items-start justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-4 sm:my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                  disabled={false}
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

          {/* Multi-Subject Assignment (Across Semesters 1-8) with Strict Exclusivity */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <label className="block text-xs font-bold text-slate-800">
                    Curriculum Subject Assignments (Semesters 1–8)
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Allocate subjects from assigned branches. A subject can only be assigned to one faculty member college-wide.
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {selectedSubjectIds.length} Subjects Selected
                </span>
              </div>
            </div>

            {selectedBranchIds.length === 0 ? (
              <div className="py-6 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
                <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">No Branches Selected Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Please assign at least one department/branch above to view and allocate curriculum subjects.
                </p>
              </div>
            ) : loadingSubjects ? (
              <div className="py-6 flex items-center justify-center text-xs text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Checking subject allocations and teacher assignments in database...</span>
              </div>
            ) : availableSubjects.length === 0 ? (
              <div className="py-4 px-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                No active subjects found for the selected branch(es). Please verify the syllabus catalog in database.
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Search & Semester Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter subjects by code or title..."
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase mr-1 flex items-center gap-0.5 shrink-0">
                      <Filter className="w-3 h-3" /> Sem:
                    </span>
                    {(["ALL", 1, 2, 3, 4, 5, 6, 7, 8] as const).map((sem) => (
                      <button
                        type="button"
                        key={sem}
                        onClick={() => setSelectedSemesterFilter(sem)}
                        className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition-colors shrink-0 cursor-pointer ${
                          selectedSemesterFilter === sem
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {sem === "ALL" ? "All" : `S${sem}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subjects List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availableSubjects
                    .filter((sub) => {
                      const matchesSem =
                        selectedSemesterFilter === "ALL" ||
                        sub.semesterNumber === selectedSemesterFilter;
                      const q = subjectSearch.trim().toLowerCase();
                      const matchesSearch =
                        !q ||
                        sub.code.toLowerCase().includes(q) ||
                        sub.name.toLowerCase().includes(q);
                      return matchesSem && matchesSearch;
                    })
                    .map((sub) => {
                      const isSelected = selectedSubjectIds.includes(sub.id);
                      const isLocked = sub.isAssignedToOther;

                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            if (!isLocked) toggleSubject(sub);
                          }}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                            isLocked
                              ? "bg-slate-100/70 border-slate-200 opacity-80 cursor-not-allowed"
                              : isSelected
                              ? "bg-purple-50/90 border-purple-300 text-purple-950 shadow-2xs cursor-pointer"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                          }`}
                        >
                          <div className="mt-0.5">
                            {isLocked ? (
                              <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                          </div>
                          <div className="truncate flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                                <span>{sub.code}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-semibold shrink-0">
                                  {sub.branchCode} · Sem {sub.semesterNumber}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {sub.credits} cr
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-600 truncate font-medium">
                              {sub.name}
                            </div>

                            {/* Status Pill */}
                            <div className="mt-1 flex items-center gap-1">
                              {isLocked ? (
                                <span
                                  title={`Assigned to ${sub.assignedToFacultyName}. Only editable from that faculty's profile.`}
                                  className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded inline-flex items-center gap-1"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Assigned to: {sub.assignedToFacultyName || "Other Faculty"}</span>
                                </span>
                              ) : isSelected ? (
                                <span className="text-[10px] font-semibold text-purple-700 bg-purple-200/80 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Assigned to this Faculty</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                  Available (Unassigned)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Exclusivity note */}
                <div className="p-2 rounded-lg bg-purple-50/50 border border-purple-100 text-[11px] text-purple-800 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Strict Exclusivity Rule:</strong> A subject can only be assigned to one teacher at a time. If locked, remove it from that teacher&apos;s profile to reassign here.
                  </span>
                </div>
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
