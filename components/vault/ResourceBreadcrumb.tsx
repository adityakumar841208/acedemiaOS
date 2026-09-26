"use client";

import React from "react";
import { VaultExplorationState } from "@/types/vault";
import {
  getVaultDepartmentById,
  getVaultSemesterById,
  getVaultSubjectById,
  getVaultModuleById,
  getVaultResourceTypes,
} from "@/lib/resource-vault-data";
import { Home, ChevronRight, Layers } from "lucide-react";

interface ResourceBreadcrumbProps {
  state: VaultExplorationState;
  onNavigateLevel: (
    level: "root" | "dept" | "sem" | "subject" | "module" | "type"
  ) => void;
}

export default function ResourceBreadcrumb({
  state,
  onNavigateLevel,
}: ResourceBreadcrumbProps) {
  const currentDept = state.selectedDepartmentId
    ? getVaultDepartmentById(state.selectedDepartmentId)
    : null;
  const currentSem = state.selectedSemesterId
    ? getVaultSemesterById(state.selectedSemesterId)
    : null;
  const currentSubj = state.selectedSubjectId
    ? getVaultSubjectById(state.selectedSubjectId)
    : null;
  const currentMod = state.selectedModuleId
    ? getVaultModuleById(state.selectedModuleId)
    : null;

  let currentTypeLabel: string | null = null;
  if (state.selectedModuleId && state.selectedResourceTypeId) {
    const types = getVaultResourceTypes(state.selectedModuleId);
    const found = types.find((t) => t.id === state.selectedResourceTypeId);
    if (found) currentTypeLabel = found.label;
  }

  return (
    <nav
      aria-label="Hierarchy Path"
      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto py-1 px-1 scrollbar-none"
    >
      {/* Root / Home */}
      <button
        type="button"
        onClick={() => onNavigateLevel("root")}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Vault Root</span>
      </button>

      {/* Department */}
      {currentDept && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            type="button"
            onClick={() => onNavigateLevel("dept")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              !currentSem
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {currentDept.code}
          </button>
        </>
      )}

      {/* Semester */}
      {currentSem && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            type="button"
            onClick={() => onNavigateLevel("sem")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              !currentSubj
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {currentSem.label}
          </button>
        </>
      )}

      {/* Subject */}
      {currentSubj && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            type="button"
            onClick={() => onNavigateLevel("subject")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 max-w-[180px] truncate ${
              !currentMod
                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title={currentSubj.name}
          >
            {currentSubj.code}: {currentSubj.name}
          </button>
        </>
      )}

      {/* Module */}
      {currentMod && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            type="button"
            onClick={() => onNavigateLevel("module")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 max-w-[160px] truncate ${
              !currentTypeLabel
                ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title={currentMod.title}
          >
            Module {currentMod.moduleNumber}
          </button>
        </>
      )}

      {/* Resource Type */}
      {currentTypeLabel && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold shrink-0">
            {currentTypeLabel}
          </span>
        </>
      )}
    </nav>
  );
}

