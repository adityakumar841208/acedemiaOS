"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Subject, Module } from "@/types";
import { useUserSession } from "@/context/UserContext";
import { isAuthorizedCRForSubject } from "@/lib/utils";
import SyllabusEditorModal from "@/components/subjects/SyllabusEditorModal";
import {
  BookOpen,
  Users,
  Layers,
  Award,
  ArrowRight,
  FolderArchive,
  Edit3,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export default function SubjectsPage() {
  const { user, isCR } = useUserSession();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // CR Editor Modal state
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingModules, setEditingModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      try {
        setLoading(true);
        const res = await fetch("/api/subjects");
        if (res.ok) {
          const d = await res.json();
          setSubjects(d.subjects || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  const handleOpenEditor = async (sub: Subject) => {
    try {
      setLoadingModules(true);
      const res = await fetch(`/api/subjects/${sub.id}`);
      if (res.ok) {
        const d = await res.json();
        setEditingSubject(d.subject || sub);
        setEditingModules(d.modules || []);
      } else {
        toast.error("Failed to load modules for editing.");
      }
    } catch {
      toast.error("Failed to load subject modules.");
    } finally {
      setLoadingModules(false);
    }
  };

  const handleSyllabusUpdated = (updatedSubject: Subject, updatedModules: Module[]) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === updatedSubject.id
          ? {
              ...s,
              ...updatedSubject,
              modulesCount: updatedModules.length,
            }
          : s
      )
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Title & CR Banner */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <BookOpen className="w-4 h-4" />
          <span>DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Semester 3 Curriculum & Subjects
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore course outlines, module breakdowns, lecture notes, and faculty contacts.
        </p>

        {isCR && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              CR Mode Active: You have authorization to manage and update subjects, credit units, faculty, and modular syllabi for your assigned class.
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((sub) => {
            const canManage = isAuthorizedCRForSubject(user, sub);

            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Header Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 font-mono">
                      {sub.code}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{sub.credits} Credits</span>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                    {sub.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed line-clamp-2">
                    {sub.description}
                  </p>

                  {/* Audit badge if updated */}
                  {sub.syllabusUpdatedAt && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>
                        Syllabus updated {new Date(sub.syllabusUpdatedAt).toLocaleDateString()}
                        {sub.syllabusUpdatedBy ? ` by ${sub.syllabusUpdatedBy}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Faculty badge */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Faculty: <strong>{sub.facultyName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{sub.modulesCount} Modules</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/resources?subject=${sub.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>Subject Vault</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditor(sub)}
                        disabled={loadingModules}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors border border-slate-200"
                        title="Edit Subject and Syllabus Modules"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Manage Syllabus</span>
                      </button>
                    )}

                    <Link
                      href={`/subjects/${sub.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <span>View Syllabus</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CR Syllabus Editor Modal */}
      {editingSubject && (
        <SyllabusEditorModal
          isOpen={!!editingSubject}
          onClose={() => setEditingSubject(null)}
          subject={editingSubject}
          modules={editingModules}
          onSuccess={handleSyllabusUpdated}
        />
      )}
    </div>
  );
}
