"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getVaultResourceById,
  getVaultResources,
  getVaultModuleById,
} from "@/lib/resource-vault-data";
import {
  ArrowLeft,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Calendar,
  User,
  HardDrive,
  FileText,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ResourceViewerPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const resourceId = resolvedParams.id;
  const router = useRouter();

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const resource = getVaultResourceById(resourceId);

  // Fallback if not found
  if (!resource) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Resource Not Found
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          The requested study material could not be located in the vault.
        </p>
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Resource Vault</span>
        </Link>
      </div>
    );
  }

  // Related materials in the same module
  const relatedResources = getVaultResources({
    moduleId: resource.moduleId,
  }).filter((r) => r.id !== resource.id);

  const handleDownload = () => {
    setDownloadCount((prev) => prev + 1);
    toast.success(`Downloaded: ${resource.title}`);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Resource URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-3 sm:px-6 py-3 sm:py-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/resources"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vault Map</span>
          </Link>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>{resource.subjectCode}</span>
            <span>/</span>
            <span>Module {resource.moduleNumber}</span>
            <span>/</span>
              <span className="font-semibold text-white">
              {resource.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copied ? "Copied" : "Share"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ({resource.fileSize})</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Main PDF Document Viewer (3 columns wide) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Document Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                    {resource.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    {resource.subjectCode}: {resource.subjectName}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {resource.title}
                </h1>
              </div>

              {resource.isVerified && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Verified Faculty Note</span>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Interactive Document Viewer Canvas */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Viewer Control Toolbar */}
            <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between text-xs">
              {/* Left: Page Scrubber */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-300">
                  Page {currentPage} of 14
                </span>
                <button
                  type="button"
                  disabled={currentPage >= 14}
                  onClick={() => setCurrentPage((p) => Math.min(14, p + 1))}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Right: Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] text-slate-300 w-12 text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] font-medium"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Document Body Simulation */}
            <div className="p-6 sm:p-10 bg-slate-950/80 overflow-y-auto max-h-[750px] flex justify-center">
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
                className="w-full max-w-3xl bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-12 min-h-[900px] border border-slate-200 transition-transform duration-200"
              >
                {/* Header within Document Page */}
                <div className="flex items-center justify-between border-b pb-4 mb-6 text-xs text-slate-500 font-mono">
                  <span>{resource.subjectCode} — {resource.subjectName}</span>
                  <span>Page {currentPage}</span>
                </div>

                {/* Document Title */}
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {resource.title.replace(".pdf", "").replace(".pptx", "")}
                </h2>
                <div className="text-xs text-indigo-600 font-semibold mb-6">
                  {resource.moduleTitle} • {resource.uploadedBy.name}
                </div>

                {/* Formatted Content Simulation */}
                <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                  {resource.contentSnippet}
                </div>

                {/* Document Footer */}
                <div className="mt-12 pt-6 border-t text-center text-xs text-slate-400 font-mono">
                  --- End of Page {currentPage} • Verified Campus Academic Material ---
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Related Materials (1 column wide) */}
        <div className="flex flex-col gap-5">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Document Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Uploaded By
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {resource.uploadedBy.name}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  File Size
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {resource.fileSize}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Upload Date
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDate(resource.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Downloads
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {resource.downloadCount + downloadCount} times
                </span>
              </div>
            </div>
          </div>

          {/* Related Materials in This Module */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Module Study Pack
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Other materials available in Module {resource.moduleNumber}
            </p>

            <div className="space-y-2.5">
              {relatedResources.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/resources/${rel.id}`}
                  className="block p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {rel.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{rel.fileSize}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {rel.title}
                  </h4>
                </Link>
              ))}

              {relatedResources.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">
                  No other files in this module.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

