"use client";

import React, { useState } from "react";
import { Subject, Module, ResourceCategory } from "@/types";
import { useUserSession } from "@/context/UserContext";
import { X, Upload, FileUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ResourceUploaderModalProps {
  subjects: Subject[];
  modules: Module[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResourceUploaderModal({
  subjects,
  modules,
  isOpen,
  onClose,
  onSuccess,
}: ResourceUploaderModalProps) {
  const { user } = useUserSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [moduleId, setModuleId] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("NOTES");
  const [contentSnippet, setContentSnippet] = useState("");
  const [fileSize, setFileSize] = useState("3.1 MB");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredModules = modules.filter((m) => m.subjectId === subjectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) {
      toast.error("Please fill in the title and select a subject.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subjectId,
          moduleId: moduleId || filteredModules[0]?.id,
          category,
          fileSize,
          contentSnippet,
          uploaderName: user?.name,
          uploaderRole: user?.role,
          uploaderId: user?.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload resource");
      }

      toast.success("Resource published to Vault successfully!");
      setTitle("");
      setDescription("");
      setContentSnippet("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish resource");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Upload Academic Resource</h3>
              <p className="text-xs text-indigo-200">Share notes, slides, or PYQs to the vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Subject & Module Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject *
              </label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  const firstMod = modules.find((m) => m.subjectId === e.target.value);
                  if (firstMod) setModuleId(firstMod.id);
                }}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}: {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Module *
              </label>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {filteredModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    Module {m.moduleNumber}: {m.title.slice(0, 26)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["NOTES", "PYQ", "PPT", "VIDEO"] as ResourceCategory[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs py-2 rounded-lg font-medium border transition-colors ${
                    category === cat
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 Dijkstra & Prim Complete Solved Handouts"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Brief Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key concepts covered, exam weightage, or formulas included..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Sample Snippet / Document preview text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Preview Content / Markdown Snippet</span>
              <button
                type="button"
                onClick={() =>
                  setContentSnippet(
                    `# Key Concepts Summary\n\n1. Quick Sort Partitioning:\n- Average time: O(N log N)\n- Worst case: O(N^2) when pivot is always extreme.\n\n2. Master Theorem Formula:\n$$T(N) = aT(N/b) + O(N^d)$$\n`
                  )
                }
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-normal"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Fill Sample
              </button>
            </label>
            <textarea
              rows={3}
              value={contentSnippet}
              onChange={(e) => setContentSnippet(e.target.value)}
              placeholder="Markdown or sample notes displayed inside the document reader..."
              className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* File simulated upload box */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50 flex items-center justify-center gap-3">
            <FileUp className="w-6 h-6 text-indigo-500" />
            <div className="text-left text-xs">
              <span className="font-semibold text-slate-700">Simulated PDF Attachment:</span>
              <div className="text-[11px] text-slate-500">
                {title ? `${title.slice(0, 20)}.pdf` : "document_sample.pdf"} • {fileSize}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? "Uploading..." : "Publish to Vault"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

