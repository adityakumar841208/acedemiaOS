"use client";

import React from "react";
import { VaultExplorationState, VaultResource } from "@/types/vault";
import {
  getVaultDepartments,
  getVaultSemestersByDept,
  getVaultSubjects,
  getVaultModules,
  getVaultResources,
  hasVaultResources,
} from "@/lib/resource-vault-data";
import {
  FileText,
  Download,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface ResourceListViewProps {
  state: VaultExplorationState;
  onOpenResource: (resourceId: string) => void;
  onSelectDepartment: (id: string) => void;
  onSelectSemester: (id: string) => void;
  onSelectSubject: (id: string) => void;
  onSelectModule: (id: string) => void;
}

export default function ResourceListView({
  state,
  onOpenResource,
  onSelectDepartment,
  onSelectSemester,
  onSelectSubject,
  onSelectModule,
}: ResourceListViewProps) {
  const departments = getVaultDepartments().filter((department) =>
    hasVaultResources({ departmentId: department.id })
  );
  const currentDeptId = state.selectedDepartmentId || departments[0]?.id;
  const semesters = currentDeptId
    ? getVaultSemestersByDept(currentDeptId).filter((semester) =>
        hasVaultResources({
          departmentId: currentDeptId,
          semesterNumber: semester.number,
        })
      )
    : [];
  const currentSemId = state.selectedSemesterId || semesters[0]?.id;
  const semNum = semesters.find((s) => s.id === currentSemId)?.number || 3;
  const subjects = getVaultSubjects(currentDeptId, semNum).filter((subject) =>
    hasVaultResources({ subjectId: subject.id })
  );
  const currentSubjId = state.selectedSubjectId || subjects[0]?.id;
  const modules = currentSubjId
    ? getVaultModules(currentSubjId).filter((module) =>
        hasVaultResources({ moduleId: module.id })
      )
    : [];

  const resources = getVaultResources({
    subjectId: state.selectedSubjectId || undefined,
    moduleId: state.selectedModuleId || undefined,
    category: state.selectedCategory === "ALL" ? undefined : state.selectedCategory,
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6">
      {/* Hierarchy Selector Tabs */}
      <div className="flex flex-wrap gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1">Dept:</span>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelectDepartment(d.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                currentDeptId === d.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {d.code}
            </button>
          ))}
        </div>

        {semesters.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            <span className="text-xs font-semibold text-slate-400 mr-1">Sem:</span>
            {semesters.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSemester(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentSemId === s.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                S{s.number}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Available Subjects Bar */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {subjects.map((sub) => {
            const isSelected = currentSubjId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubject(sub.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border shrink-0 transition-all ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-sm"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>{sub.code}: {sub.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Resource Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((res) => (
          <div
            key={res.id}
            onClick={() => onOpenResource(res.id)}
            className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {res.category}
                </span>
                <span className="text-[11px] text-slate-400">
                  {res.subjectCode} • Mod {res.moduleNumber}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors">
                {res.title}
              </h4>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                {res.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>{res.fileSize}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">
                Open Material →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

