"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { SemesterNodeData } from "@/types/vault";
import { Calendar, ChevronDown, CheckCircle2, BookOpen } from "lucide-react";

function SemesterNodeComponent({ data }: { data: SemesterNodeData }) {
  const { semester, isSelected, onSelect } = data;

  return (
    <div
      onClick={() => onSelect(semester.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(semester.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Explore ${semester.label}`}
      className={`group relative w-[240px] rounded-2xl p-4 cursor-pointer transition-all duration-300 select-none text-left ${
        isSelected
          ? "bg-indigo-950 text-white shadow-xl shadow-indigo-600/25 ring-2 ring-indigo-400 scale-[1.02]"
          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-0.5"
      }`}
    >
      {/* Top Handle from Department */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900 !top-[-6px]"
      />

      {/* Bottom Handle to Subjects */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900 !bottom-[-6px]"
      />

      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
              isSelected
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            S{semester.number}
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">{semester.label}</h4>
            <span
              className={`text-[11px] flex items-center gap-1 ${
                isSelected ? "text-indigo-200" : "text-slate-400"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {semester.academicYear}
            </span>
          </div>
        </div>

        {isSelected && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-in zoom-in-50" />
        )}
      </div>

      <div
        className={`pt-2.5 border-t flex items-center justify-between text-[11px] font-medium ${
          isSelected
            ? "border-indigo-900/60 text-indigo-200"
            : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400"
        }`}
      >
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {semester.subjectCount} Subjects
        </span>

        <div
          className={`flex items-center gap-0.5 font-semibold ${
            isSelected ? "text-indigo-300" : "text-indigo-600 dark:text-indigo-400"
          }`}
        >
          <span>{isSelected ? "Active" : "Open"}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-300 ${
              isSelected ? "rotate-180" : "group-hover:translate-y-0.5"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(SemesterNodeComponent);

