"use client";

import React, { useState, useRef, useEffect } from "react";
import { VaultCategory, VaultExplorationState } from "@/types/vault";
import { searchVaultEverywhere } from "@/lib/resource-vault-data";
import {
  Search,
  RotateCcw,
  Sparkles,
  FileText,
  BookOpen,
  Layers,
  X,
  Map as MapIcon,
  List,
  Filter,
} from "lucide-react";

interface ResourceToolbarProps {
  state: VaultExplorationState;
  onReset: () => void;
  onSelectCategory: (cat: VaultCategory | "ALL") => void;
  onJumpToSubject: (deptId: string, semId: string, subjId: string) => void;
  onJumpToResource: (resourceId: string) => void;
  viewMode: "canvas" | "list";
  onToggleViewMode: (mode: "canvas" | "list") => void;
}

export default function ResourceToolbar({
  state,
  onReset,
  onSelectCategory,
  onJumpToSubject,
  onJumpToResource,
  viewMode,
  onToggleViewMode,
}: ResourceToolbarProps) {
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchResults = query.trim() ? searchVaultEverywhere(query) : null;
  const hasResults =
    searchResults &&
    (searchResults.subjects.length > 0 ||
      searchResults.modules.length > 0 ||
      searchResults.resources.length > 0);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories: { key: VaultCategory | "ALL"; label: string; icon: string }[] = [
    { key: "ALL", label: "All Formats", icon: "✨" },
    { key: "NOTES", label: "Lecture Notes", icon: "📄" },
    { key: "PPT", label: "Slide Decks", icon: "📊" },
    { key: "PYQ", label: "PYQ Papers", icon: "📝" },
    { key: "LAB", label: "Lab Manuals", icon: "🧪" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm mb-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Search with Autocomplete Dropdown */}
        <div ref={dropdownRef} className="relative flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => query.trim() && setDropdownOpen(true)}
              placeholder="Search subjects, modules, or study materials (e.g. 'DSA', 'Binary Trees', 'Big-O')..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDropdownOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {dropdownOpen && hasResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto p-2">
              {/* Subjects */}
              {searchResults.subjects.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Subjects ({searchResults.subjects.length})
                  </div>
                  {searchResults.subjects.map((subj) => (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => {
                        onJumpToSubject(
                          subj.departmentId,
                          `sem-cse-${subj.semesterNumber}`,
                          subj.id
                        );
                        setDropdownOpen(false);
                        setQuery("");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                          {subj.code}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {subj.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                        Sem {subj.semesterNumber} • Jump →
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Resources */}
              {searchResults.resources.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800">
                    Documents & Resources ({searchResults.resources.length})
                  </div>
                  {searchResults.resources.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        onJumpToResource(res.id);
                        setDropdownOpen(false);
                        setQuery("");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {res.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0 ml-2">
                        Open Viewer →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Category Filter Chips & Reset & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Chips */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            {categories.map((c) => {
              const active = state.selectedCategory === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onSelectCategory(c.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span className="mr-1">{c.icon}</span>
                  <span className="hidden sm:inline">{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Reset Exploration Button */}
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            title="Reset map to root department cards"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Map</span>
          </button>

          {/* View Mode Toggle: Interactive Canvas vs List */}
          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={() => onToggleViewMode("canvas")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "canvas"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Interactive Node Map"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode("list")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="List & Filter View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

