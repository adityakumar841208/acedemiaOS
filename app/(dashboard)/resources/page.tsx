"use client";

import React, { useState, useCallback } from "react";
import { useUserSession } from "@/context/UserContext";
import {
  VaultExplorationState,
  VaultCategory,
} from "@/types/vault";
import ResourceVaultCanvas from "@/components/vault/ResourceVaultCanvas";
import ResourceBreadcrumb from "@/components/vault/ResourceBreadcrumb";
import ResourceToolbar from "@/components/vault/ResourceToolbar";
import ResourceListView from "@/components/vault/ResourceListView";
import ResourceUploaderModal from "@/components/resources/ResourceUploaderModal";
import {
  FolderArchive,
  Upload,
  Sparkles,
  Layers,
  GraduationCap,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { INITIAL_SUBJECTS, INITIAL_MODULES } from "@/lib/mock-data";

export default function ResourcesPage() {
  const { user, isFaculty, isCR } = useUserSession();

  // Exploration State
  const [explorationState, setExplorationState] = useState<VaultExplorationState>({
    selectedDepartmentId: null,
    selectedSemesterId: null,
    selectedSubjectId: null,
    selectedModuleId: null,
    selectedResourceTypeId: null,
    selectedCategory: "ALL",
  });

  const [viewMode, setViewMode] = useState<"canvas" | "list">("canvas");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Progressive Selection Handlers
  const handleSelectDepartment = useCallback((deptId: string) => {
    setExplorationState((prev) => {
      // Toggle or set
      if (prev.selectedDepartmentId === deptId && !prev.selectedSemesterId) {
        return prev;
      }
      return {
        ...prev,
        selectedDepartmentId: deptId,
        selectedSemesterId: null,
        selectedSubjectId: null,
        selectedModuleId: null,
        selectedResourceTypeId: null,
      };
    });
  }, []);

  const handleSelectSemester = useCallback((semId: string) => {
    setExplorationState((prev) => ({
      ...prev,
      selectedSemesterId: semId,
      selectedSubjectId: null,
      selectedModuleId: null,
      selectedResourceTypeId: null,
    }));
  }, []);

  const handleSelectSubject = useCallback((subjId: string) => {
    setExplorationState((prev) => ({
      ...prev,
      selectedSubjectId: subjId,
      selectedModuleId: null,
      selectedResourceTypeId: null,
    }));
  }, []);

  const handleSelectModule = useCallback((modId: string) => {
    setExplorationState((prev) => ({
      ...prev,
      selectedModuleId: modId,
      selectedResourceTypeId: null,
    }));
  }, []);

  const handleSelectResourceType = useCallback((typeId: string) => {
    setExplorationState((prev) => ({
      ...prev,
      selectedResourceTypeId: typeId,
    }));
  }, []);

  const handleOpenResource = useCallback((resourceId: string) => {
    window.open(`/resources/${resourceId}`, "_blank", "noopener,noreferrer");
  }, []);

  // Breadcrumb Jump Handlers
  const handleNavigateLevel = useCallback(
    (level: "root" | "dept" | "sem" | "subject" | "module" | "type") => {
      setExplorationState((prev) => {
        switch (level) {
          case "root":
            return {
              ...prev,
              selectedDepartmentId: null,
              selectedSemesterId: null,
              selectedSubjectId: null,
              selectedModuleId: null,
              selectedResourceTypeId: null,
            };
          case "dept":
            return {
              ...prev,
              selectedSemesterId: null,
              selectedSubjectId: null,
              selectedModuleId: null,
              selectedResourceTypeId: null,
            };
          case "sem":
            return {
              ...prev,
              selectedSubjectId: null,
              selectedModuleId: null,
              selectedResourceTypeId: null,
            };
          case "subject":
            return {
              ...prev,
              selectedModuleId: null,
              selectedResourceTypeId: null,
            };
          case "module":
            return {
              ...prev,
              selectedResourceTypeId: null,
            };
          case "type":
          default:
            return prev;
        }
      });
    },
    []
  );

  const handleReset = useCallback(() => {
    setExplorationState({
      selectedDepartmentId: null,
      selectedSemesterId: null,
      selectedSubjectId: null,
      selectedModuleId: null,
      selectedResourceTypeId: null,
      selectedCategory: "ALL",
    });
    toast.info("Map reset to root departments.");
  }, []);

  const handleSelectCategory = useCallback((cat: VaultCategory | "ALL") => {
    setExplorationState((prev) => ({
      ...prev,
      selectedCategory: cat,
    }));
  }, []);

  const handleJumpToSubject = useCallback(
    (deptId: string, semId: string, subjId: string) => {
      setExplorationState((prev) => ({
        ...prev,
        selectedDepartmentId: deptId,
        selectedSemesterId: semId,
        selectedSubjectId: subjId,
        selectedModuleId: null,
        selectedResourceTypeId: null,
      }));
      toast.success("Navigated to subject.");
    },
    []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Abstract Background Ornament */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Progressive Knowledge Map
            </span>
            <span className="text-xs text-indigo-300 hidden sm:inline">
              React Flow Visualizer
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Interactive Resource Vault
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Progressively explore department branches, semesters, subjects, module syllabi, and verified academic materials through an interactive node canvas.
          </p>
        </div>

        {/* Upload Action for Faculty / CR */}
        {(isFaculty || isCR) && (
          <div className="relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs sm:text-sm shadow-lg hover:bg-indigo-50 transition-all"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Publish Material</span>
            </button>
          </div>
        )}
      </div>

      {/* Toolbar & Search */}
      <ResourceToolbar
        state={explorationState}
        onReset={handleReset}
        onSelectCategory={handleSelectCategory}
        onJumpToSubject={handleJumpToSubject}
        onJumpToResource={handleOpenResource}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* Breadcrumb Path Bar */}
      <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl px-2 py-1.5 border border-slate-200/80 dark:border-slate-800">
        <ResourceBreadcrumb
          state={explorationState}
          onNavigateLevel={handleNavigateLevel}
        />
      </div>

      {/* Main Content: Interactive Canvas or Responsive List */}
      {viewMode === "canvas" ? (
        <ResourceVaultCanvas
          state={explorationState}
          callbacks={{
            onSelectDepartment: handleSelectDepartment,
            onSelectSemester: handleSelectSemester,
            onSelectSubject: handleSelectSubject,
            onSelectModule: handleSelectModule,
            onSelectResourceType: handleSelectResourceType,
            onOpenResource: handleOpenResource,
          }}
        />
      ) : (
        <ResourceListView
          state={explorationState}
          onOpenResource={handleOpenResource}
          onSelectDepartment={handleSelectDepartment}
          onSelectSemester={handleSelectSemester}
          onSelectSubject={handleSelectSubject}
          onSelectModule={handleSelectModule}
        />
      )}

      {/* Optional Uploader Modal for Faculty/CR */}
      {(isFaculty || isCR) && (
        <ResourceUploaderModal
          subjects={INITIAL_SUBJECTS}
          modules={INITIAL_MODULES}
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            setUploadModalOpen(false);
            toast.success("Academic resource published to vault!");
          }}
        />
      )}
    </div>
  );
}
