"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ResourceTypeNodeData } from "@/types/vault";
import {
  FileText,
  Presentation,
  HelpCircle,
  Code,
  BookOpen,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  NOTES: FileText,
  PPT: Presentation,
  PYQ: HelpCircle,
  LAB: Code,
  SYLLABUS: BookOpen,
};

function ResourceTypeNodeComponent({ data }: { data: ResourceTypeNodeData }) {
  const { resourceType, isSelected, onSelect } = data;
  const IconComponent = CATEGORY_ICON_MAP[resourceType.category] || FileText;

  return (
    <div
      onClick={() => onSelect(resourceType.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(resourceType.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${resourceType.label}`}
      className={`group relative w-[220px] rounded-2xl p-4 cursor-pointer transition-all duration-300 select-none text-left ${
        isSelected
          ? "bg-slate-900 text-white shadow-xl shadow-amber-500/25 ring-2 ring-amber-400 scale-[1.02]"
          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500 hover:-translate-y-0.5"
      }`}
    >
      {/* Top Handle from Module */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-slate-900 !top-[-6px]"
      />

      {/* Bottom Handle to Concrete Resources */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-slate-900 !bottom-[-6px]"
      />

      <div className="flex items-center justify-between mb-2">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isSelected
              ? "bg-amber-500 text-slate-950 font-bold"
              : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950"
          }`}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {isSelected && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in-50" />
        )}
      </div>

      <h4 className="font-bold text-sm leading-snug mb-1">{resourceType.label}</h4>

      <p
        className={`text-[11px] line-clamp-1 mb-2.5 ${
          isSelected ? "text-slate-300" : "text-slate-400"
        }`}
      >
        {resourceType.description}
      </p>

      <div
        className={`pt-2 border-t flex items-center justify-between text-[11px] font-medium ${
          isSelected
            ? "border-slate-800 text-slate-300"
            : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400"
        }`}
      >
        <span>{resourceType.fileCount} Documents</span>

        <div
          className={`flex items-center gap-0.5 font-semibold ${
            isSelected ? "text-amber-400" : "text-amber-600 dark:text-amber-400"
          }`}
        >
          <span>{isSelected ? "Showing" : "View"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              isSelected ? "rotate-180" : "group-hover:translate-y-0.5"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(ResourceTypeNodeComponent);

