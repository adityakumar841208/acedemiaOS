"use client";

import React from "react";
import { Resource } from "@/types";
import {
  FileText,
  Presentation,
  FileQuestion,
  Video,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface ResourceCardProps {
  resource: Resource;
  onPreview: (resource: Resource) => void;
  onDownload: (resource: Resource) => void;
}

export default function ResourceCard({
  resource,
  onPreview,
  onDownload,
}: ResourceCardProps) {
  const getCategoryDetails = (category: string) => {
    switch (category) {
      case "NOTES":
        return {
          icon: FileText,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          badge: "bg-blue-600 text-white",
        };
      case "PPT":
        return {
          icon: Presentation,
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          badge: "bg-amber-600 text-white",
        };
      case "PYQ":
        return {
          icon: FileQuestion,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          badge: "bg-emerald-600 text-white",
        };
      case "VIDEO":
        return {
          icon: Video,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          badge: "bg-purple-600 text-white",
        };
      default:
        return {
          icon: FileText,
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          badge: "bg-slate-600 text-white",
        };
    }
  };

  const cat = getCategoryDetails(resource.category);
  const Icon = cat.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between group">
      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cat.badge}`}
            >
              {resource.category}
            </span>
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {resource.subjectCode}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>Mod {resource.moduleNumber}</span>
            </span>
          </div>

          {resource.isVerified && (
            <span
              title="Verified by Course Faculty"
              className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>
      </div>

      {/* Meta info & actions */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
          <span className="truncate">
            By <strong className="text-slate-600">{resource.uploadedBy.name}</strong>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3 h-3" />
            <span>{formatRelativeTime(resource.createdAt)}</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 font-mono">
            {resource.fileSize} • {resource.downloadCount} downloads
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPreview(resource)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => onDownload(resource)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

