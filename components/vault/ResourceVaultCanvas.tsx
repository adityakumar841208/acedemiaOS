"use client";

import React, { useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { VaultExplorationState } from "@/types/vault";
import { buildVaultGraph, VaultGraphCallbacks } from "@/lib/vault-layout";
import { getVaultResourceTypes, getVaultResources } from "@/lib/resource-vault-data";
import DepartmentNode from "./nodes/DepartmentNode";
import SemesterNode from "./nodes/SemesterNode";
import SubjectNode from "./nodes/SubjectNode";
import ModuleNode from "./nodes/ModuleNode";
import ResourceTypeNode from "./nodes/ResourceTypeNode";
import ResourceNode from "./nodes/ResourceNode";
import { Info, Layers } from "lucide-react";

interface ResourceVaultCanvasProps {
  state: VaultExplorationState;
  callbacks: VaultGraphCallbacks;
}

const nodeTypes = {
  departmentNode: DepartmentNode,
  semesterNode: SemesterNode,
  subjectNode: SubjectNode,
  moduleNode: ModuleNode,
  resourceTypeNode: ResourceTypeNode,
  resourceNode: ResourceNode,
};

function InnerCanvas({ state, callbacks }: ResourceVaultCanvasProps) {
  const { fitView } = useReactFlow();
  const prevLevelRef = useRef<string>("");

  const { nodes, edges } = useMemo(() => {
    return buildVaultGraph(state, callbacks);
  }, [state, callbacks]);

  // Determine current active depth level string
  const currentDepthLevel = useMemo(() => {
    if (state.selectedResourceTypeId) return "Level 5: Study Documents";
    if (state.selectedModuleId) return "Level 4: Resource Types";
    if (state.selectedSubjectId) return "Level 3: Modules";
    if (state.selectedSemesterId) return "Level 2: Subjects";
    if (state.selectedDepartmentId) return "Level 1: Semesters";
    return "Level 0: Departments";
  }, [state]);

  const selectedResourceCount = useMemo(() => {
    if (!state.selectedResourceTypeId || !state.selectedModuleId) return null;
    const selectedType = getVaultResourceTypes(state.selectedModuleId).find(
      (resourceType) => resourceType.id === state.selectedResourceTypeId
    );
    return selectedType
      ? getVaultResources({
          subjectId: state.selectedSubjectId || undefined,
          moduleId: state.selectedModuleId,
          category: selectedType.category,
        }).length
      : 0;
  }, [state.selectedModuleId, state.selectedResourceTypeId, state.selectedSubjectId]);

  // Smoothly adjust viewport fit when expanding deeper levels
  useEffect(() => {
    const currentKey = `${state.selectedDepartmentId}-${state.selectedSemesterId}-${state.selectedSubjectId}-${state.selectedModuleId}-${state.selectedResourceTypeId}`;
    if (prevLevelRef.current !== currentKey) {
      prevLevelRef.current = currentKey;
      const timer = setTimeout(() => {
        fitView({
          duration: 700,
          padding: 0.18,
          maxZoom: 1.1,
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [state, fitView]);

  return (
    <div className="relative w-full h-[650px] sm:h-[750px] lg:h-[820px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950/[0.02] dark:bg-slate-950/40 shadow-inner overflow-hidden select-none">
      {/* Floating Top Header Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>{currentDepthLevel}</span>
        </div>

        <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Click any card to reveal its child branches</span>
        </div>
      </div>

      {/* Floating Bottom Quick Hint */}
      <div className="absolute bottom-4 left-12 z-10 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-sm text-[11px] text-slate-400">
        <span>💡 Drag canvas to pan • Scroll to zoom • Click a resource to view</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#94a3b8"
          className="opacity-40 dark:opacity-20"
        />

        <Controls className="vault-flow-controls" />

      </ReactFlow>

      {selectedResourceCount === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="rounded-2xl border border-slate-200 bg-white/95 px-5 py-4 text-center text-sm font-semibold text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300">
            No resources available yet.
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResourceVaultCanvas(props: ResourceVaultCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerCanvas {...props} />
    </ReactFlowProvider>
  );
}

