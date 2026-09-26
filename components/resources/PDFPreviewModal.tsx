"use client";

import React, { useState } from "react";
import { Resource } from "@/types";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  FileText,
  CheckCircle2,
  Calendar,
  User,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface PDFPreviewModalProps {
  resource: Resource | null;
  onClose: () => void;
  onDownload: (resource: Resource) => void;
}

export default function PDFPreviewModal({
  resource,
  onClose,
  onDownload,
}: PDFPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!resource) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {resource.category}
                </span>
                <span className="text-xs text-slate-400">
                  {resource.subjectCode} • Module {resource.moduleNumber}
                </span>
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-white truncate mt-0.5">
                {resource.title}
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-700/60 rounded-lg p-1 border border-slate-600">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                className="p-1 hover:text-white text-slate-400 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs px-2 text-slate-300 font-mono">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                className="p-1 hover:text-white text-slate-400 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={() => onDownload(resource)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Viewer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            className="w-full max-w-2xl bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-10 transition-transform duration-150 border border-slate-300"
          >
            {/* Document Header banner */}
            <div className="border-b-2 border-indigo-600 pb-4 mb-6">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>CAMPUS ACADEMIC REPOSITORY</span>
                <span className="font-mono">{resource.fileSize} • VERIFIED DOCUMENT</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {resource.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>By {resource.uploadedBy.name} ({resource.uploadedBy.role.toUpperCase()})</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(resource.createdAt)}</span>
                </span>
                {resource.isVerified && (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Faculty Verified</span>
                  </span>
                )}
              </div>
            </div>

            {/* Document Content */}
            <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                <strong>Course:</strong> {resource.subjectCode} - {resource.subjectName} |{" "}
                <strong>Module:</strong> {resource.moduleNumber} ({resource.moduleTitle})
              </div>

              <div className="whitespace-pre-wrap font-sans text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                {resource.contentSnippet || resource.description}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span>Page 1 of 4 • Confidential Academic Use Only</span>
                <span>Download count: {resource.downloadCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>File: {resource.fileUrl}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.origin + `/resources?id=${resource.id}`);
              toast.success("Resource link copied to clipboard!");
            }}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Resource</span>
          </button>
        </div>
      </div>
    </div>
  );
}

