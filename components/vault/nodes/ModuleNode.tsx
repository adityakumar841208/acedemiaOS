"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ModuleNodeData } from "@/types/vault";
import { Layers, ChevronDown, CheckCircle2, Tag } from "lucide-react";

function ModuleNodeComponent({ data }: { data: ModuleNodeData }) {
  const { module, isSelected, onSelect } = data;

  return (
    <div
      onClick={() => onSelect(module.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(module.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Explore ${module.title}`}
      className={`group relative w-70 rounded-2xl p-4 cursor-pointer transition-all duration-300 select-none text-left ${
        isSelected
          ? "bg-slate-900 text-white shadow-xl shadow-purple-500/25 ring-2 ring-purple-500 scale-[1.02]"
          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500 hover:-translate-y-0.5"
      }`}
    >
      {/* Top Handle from Subject */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3! h-3! bg-purple-500! border-2! !border-white! dark:border-slate-900! -top[-6px]!"
      />

      {/* Bottom Handle to Resource Types */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3! h-3! !bg-purple-500! border-2 border-white! dark:border-slate-900! -bottom[-6px]!"
      />

      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
            isSelected
              ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
              : "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
          }`}
        >
          Module {module.moduleNumber}
        </span>

        {isSelected && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in-50" />
        )}
      </div>

      <h4 className="font-bold text-sm leading-snug mb-2 line-clamp-1">
        {module.title}
      </h4>

      {/* Topics Pill List */}
      <div className="flex flex-wrap gap-1 mb-3">
        {module.topics.slice(0, 3).map((topic, i) => (
          <span
            key={i}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              isSelected
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            {topic}
          </span>
        ))}
        {module.topics.length > 3 && (
          <span className="text-[10px] text-slate-400">
            +{module.topics.length - 3} more
          </span>
        )}
      </div>

      <div
        className={`pt-2.5 border-t flex items-center justify-between text-[11px] font-medium ${
          isSelected
            ? "border-slate-800 text-slate-300"
            : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400"
        }`}
      >
        <span className="text-slate-400">{module.resourceCount} Files Available</span>

        <div
          className={`flex items-center gap-0.5 font-semibold ${
            isSelected ? "text-purple-300" : "text-purple-600 dark:text-purple-400"
          }`}
        >
          <span>{isSelected ? "Active" : "Resources"}</span>
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

export default memo(ModuleNodeComponent);

