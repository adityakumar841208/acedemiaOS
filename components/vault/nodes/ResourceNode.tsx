"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ResourceNodeData } from "@/types/vault";
import {
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  ArrowRight,
} from "lucide-react";

function ResourceNodeComponent({ data }: { data: ResourceNodeData }) {
  const { resource, onOpen } = data;

  return (
    <div
      onClick={() => onOpen(resource.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(resource.id);
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Open ${resource.title}`}
      className="group relative w-[300px] rounded-2xl p-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 cursor-pointer select-none text-left hover:-translate-y-1"
    >
      {/* Top Handle from ResourceType */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white dark:!border-slate-900 !top-[-6px]"
      />

      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <FileText className="w-5 h-5" />
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {resource.fileType.toUpperCase()}
          </span>
          {resource.isVerified && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
      </div>

      <h4 className="font-bold text-sm leading-snug mb-1.5 text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {resource.title}
      </h4>

      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
        {resource.description}
      </p>

      {/* Footer Info & Action */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {resource.fileSize}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {resource.downloadCount}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(resource.id);
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default memo(ResourceNodeComponent);

