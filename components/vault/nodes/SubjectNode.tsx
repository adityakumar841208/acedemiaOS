"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { SubjectNodeData } from "@/types/vault";
import { BookOpen, User, Layers, ChevronDown, CheckCircle2 } from "lucide-react";

function SubjectNodeComponent({ data }: { data: SubjectNodeData }) {
  const { subject, isSelected, onSelect } = data;

  return (
    <div
      onClick={() => onSelect(subject.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(subject.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Explore ${subject.name}`}
      className={`group relative w-[280px] rounded-2xl p-4 cursor-pointer transition-all duration-300 select-none text-left overflow-hidden ${
        isSelected
          ? "bg-slate-900 text-white shadow-xl shadow-blue-500/25 ring-2 ring-blue-500 scale-[1.02]"
          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5"
      }`}
    >
      {/* Accent Header Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${subject.gradient}`}
      />

      {/* Top Handle from Semester */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-900 !top-[-6px]"
      />

      {/* Bottom Handle to Modules */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-900 !bottom-[-6px]"
      />

      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
            isSelected
              ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
              : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50"
          }`}
        >
          {subject.code}
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400">
            {subject.credits} Credits
          </span>
          {isSelected && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in-50" />
          )}
        </div>
      </div>

      <h4 className="font-bold text-sm leading-snug mb-1 line-clamp-1">
        {subject.name}
      </h4>

      <p
        className={`text-xs flex items-center gap-1.5 mb-3 ${
          isSelected ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        <User className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{subject.facultyName}</span>
      </p>

      <div
        className={`pt-2.5 border-t flex items-center justify-between text-[11px] font-medium ${
          isSelected
            ? "border-slate-800 text-slate-300"
            : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400"
        }`}
      >
        <span className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          {subject.modulesCount} Modules
        </span>

        <div
          className={`flex items-center gap-0.5 font-semibold ${
            isSelected ? "text-blue-400" : "text-blue-600 dark:text-blue-400"
          }`}
        >
          <span>{isSelected ? "Expanded" : "Modules"}</span>
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

export default memo(SubjectNodeComponent);

