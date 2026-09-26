"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { DepartmentNodeData } from "@/types/vault";
import { Laptop, Cpu, Cog, Zap, ChevronDown, CheckCircle2 } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Laptop,
  Cpu,
  Cog,
  Zap,
};

function DepartmentNodeComponent({ data }: { data: DepartmentNodeData }) {
  const { department, isSelected, onSelect } = data;
  const IconComponent = ICON_MAP[department.icon] || Laptop;

  return (
    <div
      onClick={() => onSelect(department.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(department.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Explore ${department.name}`}
      className={`group relative w-[320px] rounded-2xl p-5 cursor-pointer transition-all duration-300 select-none text-left ${
        isSelected
          ? "bg-slate-900 text-white shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-500 scale-[1.02]"
          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-1"
      }`}
    >
      {/* Top Source/Target Handles for React Flow */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900 !bottom-[-6px] transition-transform group-hover:scale-125"
      />

      {/* Header Badge & Icon */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
              : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white"
          }`}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isSelected
                ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            {department.code}
          </span>
          {isSelected && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in-50 duration-200" />
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-base leading-snug mb-1.5 line-clamp-1">
        {department.name}
      </h3>

      {/* Description */}
      <p
        className={`text-xs line-clamp-2 mb-4 leading-relaxed ${
          isSelected
            ? "text-slate-300"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {department.description}
      </p>

      {/* Footer Stats & Expand Indicator */}
      <div
        className={`pt-3 border-t flex items-center justify-between text-xs font-medium ${
          isSelected
            ? "border-slate-800 text-slate-300"
            : "border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400"
        }`}
      >
        <div className="flex items-center gap-2">
          <span>{department.totalSemesters} Semesters</span>
          <span>•</span>
          <span>{department.totalResources} Resources</span>
        </div>

        <div
          className={`flex items-center gap-1 font-semibold text-xs ${
            isSelected ? "text-indigo-400" : "text-indigo-600 dark:text-indigo-400"
          }`}
        >
          <span>{isSelected ? "Expanded" : "Explore"}</span>
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

export default memo(DepartmentNodeComponent);

