"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Subject, Module, Resource, Assignment } from "@/types";
import { useUserSession } from "@/context/UserContext";
import { isAuthorizedCRForSubject } from "@/lib/utils";
import SyllabusEditorModal from "@/components/subjects/SyllabusEditorModal";
import ResourceCard from "@/components/resources/ResourceCard";
import PDFPreviewModal from "@/components/resources/PDFPreviewModal";
import AssignmentCard from "@/components/assignments/AssignmentCard";
import {
  BookOpen,
  ArrowLeft,
  Layers,
  Award,
  Users,
  FolderArchive,
  FileCheck2,
  CheckCircle,
  Edit3,
  Clock,
  Bookmark,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function SubjectDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useUserSession();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<"SYLLABUS" | "RESOURCES" | "ASSIGNMENTS">("SYLLABUS");
  const [loading, setLoading] = useState(true);

  // CR Syllabus Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // PDF Preview
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  useEffect(() => {
    async function loadSubjectData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/subjects/${id}`);
        if (res.ok) {
          const d = await res.json();
          setSubject(d.subject);
          setModules(d.modules || []);
          setResources(d.resources || []);
          setAssignments(d.assignments || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSubjectData();
  }, [id]);

  const handleDownload = async (res: Resource) => {
    try {
      await fetch(`/api/resources/${res.id}/download`, { method: "POST" });
      setResources((prev) =>
        prev.map((r) =>
          r.id === res.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
        )
      );
      toast.success(`Download started for ${res.title}`);
    } catch {
      toast.error("Download failed");
    }
  };

  const handleSyllabusUpdated = (updatedSubject: Subject, updatedModules: Module[]) => {
    setSubject(updatedSubject);
    setModules(updatedModules);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Subject Not Found</h2>
        <Link
          href="/subjects"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Subjects</span>
        </Link>
      </div>
    );
  }

  // STRICT AUTHORIZATION: CR ONLY for the subject's department & semester
  const canManageSyllabus = isAuthorizedCRForSubject(user, subject);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Back button & Action controls */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Subjects Directory</span>
        </Link>

        {canManageSyllabus && (
          <button
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Subject & Modules</span>
          </button>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200 font-mono">
              {subject.code}
            </span>
            {canManageSyllabus && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>CR Managed Syllabus</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {subject.credits} Academic Credits
            </span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {modules.length} Modules
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {subject.name}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {subject.description}
        </p>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Course Instructor: <strong className="text-slate-700">{subject.facultyName}</strong></span>
          </div>

          {subject.syllabusUpdatedAt && (
            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Updated: {new Date(subject.syllabusUpdatedAt).toLocaleDateString()}
                {subject.syllabusUpdatedBy ? ` by ${subject.syllabusUpdatedBy} (CR)` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex items-center gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab("SYLLABUS")}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === "SYLLABUS"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Syllabus Modules ({modules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("RESOURCES")}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === "RESOURCES"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Course Notes & PYQs ({resources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ASSIGNMENTS")}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === "ASSIGNMENTS"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Lab Assignments ({assignments.length})</span>
        </button>
      </div>

      {/* Tab 1: Syllabus Modules */}
      {activeTab === "SYLLABUS" && (
        <div className="space-y-4">
          {/* Prescribed References Section */}
          {subject.references && subject.references.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Bookmark className="w-4 h-4 text-indigo-600" />
                <span>Prescribed Textbooks & References</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {subject.references.map((ref, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {modules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs space-y-3">
              <p>No modular syllabus published for this subject yet.</p>
              {canManageSyllabus && (
                <button
                  onClick={() => setIsEditorOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Create Modular Syllabus
                </button>
              )}
            </div>
          ) : (
            modules.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Module {m.moduleNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {m.topics.length} Key Concepts
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {m.title}
                </h3>

                {m.description && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {m.description}
                  </p>
                )}

                {m.topics && m.topics.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      Key Topics & Curriculum Items:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      {m.topics.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Resources */}
      {activeTab === "RESOURCES" && (
        <div>
          {resources.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No notes uploaded specifically for this subject yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((res) => (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  onPreview={(r) => setPreviewResource(r)}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Assignments */}
      {activeTab === "ASSIGNMENTS" && (
        <div>
          {assignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No active assignments for this subject.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* PDF Document Preview Modal */}
      <PDFPreviewModal
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
        onDownload={handleDownload}
      />

      {/* CR Syllabus Editor Modal (Strictly available to authorized CR) */}
      {canManageSyllabus && (
        <SyllabusEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          subject={subject}
          modules={modules}
          onSuccess={handleSyllabusUpdated}
        />
      )}
    </div>
  );
}
