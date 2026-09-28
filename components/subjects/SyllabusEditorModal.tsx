"use client";

import React, { useState, useEffect } from "react";
import { Subject, Module } from "@/types";
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Layers,
  Save,
  AlertTriangle,
  CheckCircle,
  FileText,
  Bookmark,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface SyllabusEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  modules: Module[];
  onSuccess: (updatedSubject: Subject, updatedModules: Module[]) => void;
}

interface EditableModule {
  id?: string;
  moduleNumber: number;
  title: string;
  description: string;
  topics: string[];
}

export default function SyllabusEditorModal({
  isOpen,
  onClose,
  subject,
  modules: initialModules,
  onSuccess,
}: SyllabusEditorModalProps) {
  // Form States
  const [name, setName] = useState(subject.name);
  const [code, setCode] = useState(subject.code);
  const [facultyName, setFacultyName] = useState(subject.facultyName);
  const [credits, setCredits] = useState(subject.credits);
  const [description, setDescription] = useState(subject.description);
  const [references, setReferences] = useState<string[]>(subject.references || []);
  const [newRefInput, setNewRefInput] = useState("");

  const [modules, setModules] = useState<EditableModule[]>([]);
  const [newTopicInputs, setNewTopicInputs] = useState<Record<number, string>>({});

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Sync state whenever subject or modules change
  useEffect(() => {
    if (isOpen) {
      setName(subject.name);
      setCode(subject.code);
      setFacultyName(subject.facultyName);
      setCredits(subject.credits);
      setDescription(subject.description);
      setReferences(subject.references || []);
      setNewRefInput("");

      const sorted = [...initialModules].sort((a, b) => a.moduleNumber - b.moduleNumber);
      setModules(
        sorted.map((m) => ({
          id: m.id,
          moduleNumber: m.moduleNumber,
          title: m.title,
          description: m.description,
          topics: [...m.topics],
        }))
      );
      setIsDirty(false);
      setShowDiscardConfirm(false);
    }
  }, [isOpen, subject, initialModules]);

  // Unsaved changes beforeunload guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    if (isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  if (!isOpen) return null;

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    setIsDirty(false);
    onClose();
  };

  const handleAddReference = () => {
    if (!newRefInput.trim()) return;
    setReferences((prev) => [...prev, newRefInput.trim()]);
    setNewRefInput("");
    setIsDirty(true);
  };

  const handleRemoveReference = (idx: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const handleModuleChange = (
    index: number,
    field: keyof Omit<EditableModule, "topics">,
    value: any
  ) => {
    setModules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setIsDirty(true);
  };

  const handleAddModule = () => {
    const nextNumber = modules.length > 0 ? Math.max(...modules.map((m) => m.moduleNumber)) + 1 : 1;
    setModules((prev) => [
      ...prev,
      {
        moduleNumber: nextNumber,
        title: "",
        description: "",
        topics: [],
      },
    ]);
    setIsDirty(true);
  };

  const handleRemoveModule = (index: number) => {
    setModules((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((m, idx) => ({ ...m, moduleNumber: idx + 1 }));
    });
    setIsDirty(true);
  };

  const handleAddTopic = (moduleIndex: number) => {
    const val = (newTopicInputs[moduleIndex] || "").trim();
    if (!val) return;

    setModules((prev) => {
      const next = [...prev];
      next[moduleIndex] = {
        ...next[moduleIndex],
        topics: [...next[moduleIndex].topics, val],
      };
      return next;
    });

    setNewTopicInputs((prev) => ({ ...prev, [moduleIndex]: "" }));
    setIsDirty(true);
  };

  const handleRemoveTopic = (moduleIndex: number, topicIndex: number) => {
    setModules((prev) => {
      const next = [...prev];
      next[moduleIndex] = {
        ...next[moduleIndex],
        topics: next[moduleIndex].topics.filter((_, i) => i !== topicIndex),
      };
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Subject name cannot be empty.");
      return;
    }
    if (!code.trim()) {
      toast.error("Subject code cannot be empty.");
      return;
    }

    for (let i = 0; i < modules.length; i++) {
      if (!modules[i].title.trim()) {
        toast.error(`Module #${modules[i].moduleNumber} must have a title.`);
        return;
      }
    }

    try {
      setIsSaving(true);
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          facultyName: facultyName.trim(),
          credits: Number(credits),
          description: description.trim(),
          references: references.filter(Boolean),
          modules: modules.map((m) => ({
            id: m.id,
            moduleNumber: m.moduleNumber,
            title: m.title.trim(),
            description: m.description.trim(),
            topics: m.topics,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update syllabus.");
      }

      toast.success("Syllabus and modules updated successfully!");
      setIsDirty(false);
      onSuccess(data.subject, data.modules);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Manage Subject & Syllabus</h2>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  CR Authorized
                </span>
                {isDirty && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                    Unsaved Edits
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Update course outline, credit units, faculty, and modular curriculum for your class.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Subject Details */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>General Subject Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setIsDirty(true);
                  }}
                  required
                  placeholder="e.g. CS301"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsDirty(true);
                  }}
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Instructor / Faculty Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={facultyName}
                    onChange={(e) => {
                      setFacultyName(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Prof. Rajesh Sharma"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Credits
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={credits}
                  onChange={(e) => {
                    setCredits(Number(e.target.value));
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Description & Objectives
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Comprehensive description of the subject..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Prescribed References */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              <span>Prescribed Textbooks & Reference Links</span>
            </div>

            <div className="space-y-2">
              {references.map((ref, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700"
                >
                  <span className="truncate flex-1">{ref}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveReference(idx)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newRefInput}
                onChange={(e) => setNewRefInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddReference();
                  }
                }}
                placeholder="Add textbook title, author, or link (e.g. Introduction to Algorithms - CLRS)"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddReference}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ref</span>
              </button>
            </div>
          </div>

          {/* Section 3: Modular Syllabus */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Curriculum Modules ({modules.length})</span>
              </div>

              <button
                type="button"
                onClick={handleAddModule}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors border border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Module</span>
              </button>
            </div>

            {modules.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                No modules defined yet. Click &quot;Add New Module&quot; above to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((m, mIdx) => (
                  <div
                    key={m.id || mIdx}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                          Module {m.moduleNumber}
                        </span>
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => handleModuleChange(mIdx, "title", e.target.value)}
                          placeholder="Module Title (e.g. Graph Algorithms & Trees)"
                          className="text-sm font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveModule(mIdx)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove this module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Module Overview
                      </label>
                      <textarea
                        rows={2}
                        value={m.description}
                        onChange={(e) => handleModuleChange(mIdx, "description", e.target.value)}
                        placeholder="Key concepts covered in this module..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Topics section */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Curriculum Topics & Key Concepts ({m.topics.length})
                      </label>

                      <div className="flex flex-wrap gap-1.5">
                        {m.topics.map((top, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{top}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTopic(mIdx, tIdx)}
                              className="text-slate-400 hover:text-red-600 ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newTopicInputs[mIdx] || ""}
                          onChange={(e) =>
                            setNewTopicInputs((prev) => ({ ...prev, [mIdx]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTopic(mIdx);
                            }
                          }}
                          placeholder="Type topic and press Enter..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTopic(mIdx)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                        >
                          + Add Topic
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <button
            type="button"
            onClick={handleRequestClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-xs text-amber-600 font-medium hidden sm:inline">
                Don&apos;t forget to save your edits!
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Syllabus...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Publish Syllabus</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Unsaved Changes Discard Confirmation Dialog */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">Discard unsaved changes?</h4>
                <p className="text-xs text-slate-500 mt-1">
                  You have modified the syllabus content. If you leave now, your changes will be lost.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
