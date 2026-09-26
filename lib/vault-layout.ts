import { Node, Edge, MarkerType } from "@xyflow/react";
import {
  VaultExplorationState,
  DepartmentNodeData,
  SemesterNodeData,
  SubjectNodeData,
  ModuleNodeData,
  ResourceTypeNodeData,
  ResourceNodeData,
} from "@/types/vault";
import {
  getVaultDepartments,
  getVaultDepartmentById,
  getVaultSemestersByDept,
  getVaultSemesterById,
  getVaultSubjects,
  getVaultSubjectById,
  getVaultModules,
  getVaultModuleById,
  getVaultResourceTypes,
  getVaultResources,
  hasVaultResources,
} from "./resource-vault-data";

export interface VaultGraphCallbacks {
  onSelectDepartment: (deptId: string) => void;
  onSelectSemester: (semId: string) => void;
  onSelectSubject: (subjId: string) => void;
  onSelectModule: (modId: string) => void;
  onSelectResourceType: (typeId: string) => void;
  onOpenResource: (resourceId: string) => void;
}

export function buildVaultGraph(
  state: VaultExplorationState,
  callbacks: VaultGraphCallbacks
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Helper to calculate X offsets for centered row of cards
  const calculateRowPositions = (
    count: number,
    cardWidth: number,
    gap: number,
    centerX: number
  ): number[] => {
    const totalWidth = count * cardWidth + (count - 1) * gap;
    const startX = centerX - totalWidth / 2;
    return Array.from({ length: count }, (_, i) => startX + i * (cardWidth + gap));
  };

  // -------------------------------------------------------------
  // LEVEL 0: DEPARTMENTS (Always visible)
  // -------------------------------------------------------------
  const departments = getVaultDepartments().filter((dept) =>
    hasVaultResources({ departmentId: dept.id })
  );
  const deptCardWidth = 320;
  const deptGap = 40;
  const deptY = 40;
  const deptPositions = calculateRowPositions(
    departments.length,
    deptCardWidth,
    deptGap,
    600
  );

  const deptXMap = new Map<string, number>();

  departments.forEach((dept, index) => {
    const x = deptPositions[index];
    deptXMap.set(dept.id, x + deptCardWidth / 2);
    const isSelected = state.selectedDepartmentId === dept.id;

    nodes.push({
      id: `dept-${dept.id}`,
      type: "departmentNode",
      position: { x, y: deptY },
      data: {
        department: dept,
        isSelected,
        onSelect: callbacks.onSelectDepartment,
      } as DepartmentNodeData,
    });
  });

  // If no department is selected, return only top-level department cards
  if (!state.selectedDepartmentId) {
    return { nodes, edges };
  }

  // -------------------------------------------------------------
  // LEVEL 1: SEMESTERS
  // -------------------------------------------------------------
  const semesters = getVaultSemestersByDept(state.selectedDepartmentId).filter((sem) =>
    hasVaultResources({
      departmentId: state.selectedDepartmentId || undefined,
      semesterNumber: sem.number,
    })
  );
  const semCardWidth = 240;
  const semGap = 24;
  const semY = 280;
  const parentDeptX = deptXMap.get(state.selectedDepartmentId) || 600;

  // Display semesters for this department
  const semPositions = calculateRowPositions(
    semesters.length,
    semCardWidth,
    semGap,
    parentDeptX
  );

  const semXMap = new Map<string, number>();

  semesters.forEach((sem, index) => {
    const x = semPositions[index];
    semXMap.set(sem.id, x + semCardWidth / 2);
    const isSelected = state.selectedSemesterId === sem.id;

    nodes.push({
      id: `sem-${sem.id}`,
      type: "semesterNode",
      position: { x, y: semY },
      data: {
        semester: sem,
        isSelected,
        onSelect: callbacks.onSelectSemester,
      } as SemesterNodeData,
    });

    // Edge from Department to Semester
    edges.push({
      id: `edge-dept-${state.selectedDepartmentId}-sem-${sem.id}`,
      source: `dept-${state.selectedDepartmentId}`,
      target: `sem-${sem.id}`,
      type: "smoothstep",
      animated: true,
      style: {
        stroke: isSelected ? "#6366f1" : "#94a3b8",
        strokeWidth: isSelected ? 2.5 : 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isSelected ? "#6366f1" : "#94a3b8",
        width: 12,
        height: 12,
      },
    });
  });

  if (!state.selectedSemesterId) {
    return { nodes, edges };
  }

  // -------------------------------------------------------------
  // LEVEL 2: SUBJECTS
  // -------------------------------------------------------------
  const selectedSem = getVaultSemesterById(state.selectedSemesterId);
  const semNumber = selectedSem ? selectedSem.number : 3;
  const subjects = getVaultSubjects(state.selectedDepartmentId, semNumber).filter((subject) =>
    hasVaultResources({ subjectId: subject.id })
  );

  const subjCardWidth = 280;
  const subjGap = 28;
  const subjY = 460;
  const parentSemX = semXMap.get(state.selectedSemesterId) || parentDeptX;

  const subjPositions = calculateRowPositions(
    subjects.length,
    subjCardWidth,
    subjGap,
    parentSemX
  );

  const subjXMap = new Map<string, number>();

  subjects.forEach((subj, index) => {
    const x = subjPositions[index];
    subjXMap.set(subj.id, x + subjCardWidth / 2);
    const isSelected = state.selectedSubjectId === subj.id;

    nodes.push({
      id: `subj-${subj.id}`,
      type: "subjectNode",
      position: { x, y: subjY },
      data: {
        subject: subj,
        isSelected,
        onSelect: callbacks.onSelectSubject,
      } as SubjectNodeData,
    });

    // Edge from Semester to Subject
    edges.push({
      id: `edge-sem-${state.selectedSemesterId}-subj-${subj.id}`,
      source: `sem-${state.selectedSemesterId}`,
      target: `subj-${subj.id}`,
      type: "smoothstep",
      animated: true,
      style: {
        stroke: isSelected ? "#3b82f6" : "#94a3b8",
        strokeWidth: isSelected ? 2.5 : 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isSelected ? "#3b82f6" : "#94a3b8",
        width: 12,
        height: 12,
      },
    });
  });

  if (!state.selectedSubjectId) {
    return { nodes, edges };
  }

  // -------------------------------------------------------------
  // LEVEL 3: MODULES
  // -------------------------------------------------------------
  const modules = getVaultModules(state.selectedSubjectId).filter((module) =>
    hasVaultResources({ moduleId: module.id })
  );
  const modCardWidth = 280;
  const modGap = 24;
  const modY = 690;
  const parentSubjX = subjXMap.get(state.selectedSubjectId) || parentSemX;

  const modPositions = calculateRowPositions(
    modules.length,
    modCardWidth,
    modGap,
    parentSubjX
  );

  const modXMap = new Map<string, number>();

  modules.forEach((mod, index) => {
    const x = modPositions[index];
    modXMap.set(mod.id, x + modCardWidth / 2);
    const isSelected = state.selectedModuleId === mod.id;

    nodes.push({
      id: `mod-${mod.id}`,
      type: "moduleNode",
      position: { x, y: modY },
      data: {
        module: mod,
        isSelected,
        onSelect: callbacks.onSelectModule,
      } as ModuleNodeData,
    });

    // Edge from Subject to Module
    edges.push({
      id: `edge-subj-${state.selectedSubjectId}-mod-${mod.id}`,
      source: `subj-${state.selectedSubjectId}`,
      target: `mod-${mod.id}`,
      type: "smoothstep",
      animated: true,
      style: {
        stroke: isSelected ? "#8b5cf6" : "#94a3b8",
        strokeWidth: isSelected ? 2.5 : 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isSelected ? "#8b5cf6" : "#94a3b8",
        width: 12,
        height: 12,
      },
    });
  });

  if (!state.selectedModuleId) {
    return { nodes, edges };
  }

  // -------------------------------------------------------------
  // LEVEL 4: RESOURCE TYPES (Notes, PPTs, PYQs, Labs)
  // -------------------------------------------------------------
  const resourceTypes = getVaultResourceTypes(state.selectedModuleId).filter((resourceType) =>
    hasVaultResources({
      moduleId: state.selectedModuleId || undefined,
      category: resourceType.category,
    })
  );
  const typeCardWidth = 220;
  const typeGap = 20;
  const typeY = 930;
  const parentModX = modXMap.get(state.selectedModuleId) || parentSubjX;

  const typePositions = calculateRowPositions(
    resourceTypes.length,
    typeCardWidth,
    typeGap,
    parentModX
  );

  const typeXMap = new Map<string, number>();

  resourceTypes.forEach((resType, index) => {
    const x = typePositions[index];
    typeXMap.set(resType.id, x + typeCardWidth / 2);
    const isSelected = state.selectedResourceTypeId === resType.id;

    nodes.push({
      id: `type-${resType.id}`,
      type: "resourceTypeNode",
      position: { x, y: typeY },
      data: {
        resourceType: resType,
        isSelected,
        onSelect: callbacks.onSelectResourceType,
      } as ResourceTypeNodeData,
    });

    // Edge from Module to ResourceType
    edges.push({
      id: `edge-mod-${state.selectedModuleId}-type-${resType.id}`,
      source: `mod-${state.selectedModuleId}`,
      target: `type-${resType.id}`,
      type: "smoothstep",
      animated: true,
      style: {
        stroke: isSelected ? "#f59e0b" : "#94a3b8",
        strokeWidth: isSelected ? 2.5 : 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isSelected ? "#f59e0b" : "#94a3b8",
        width: 12,
        height: 12,
      },
    });
  });

  if (!state.selectedResourceTypeId) {
    return { nodes, edges };
  }

  // -------------------------------------------------------------
  // LEVEL 5: INDIVIDUAL CONCRETE RESOURCES
  // -------------------------------------------------------------
  const selectedTypeObj = resourceTypes.find(
    (t) => t.id === state.selectedResourceTypeId
  );
  const targetCategory = selectedTypeObj ? selectedTypeObj.category : undefined;

  const concreteResources = getVaultResources({
    subjectId: state.selectedSubjectId,
    moduleId: state.selectedModuleId,
    category: targetCategory,
  });

  const resCardWidth = 300;
  const resGap = 24;
  const resY = 1140;
  const parentTypeX = typeXMap.get(state.selectedResourceTypeId) || parentModX;

  const resPositions = calculateRowPositions(
    concreteResources.length,
    resCardWidth,
    resGap,
    parentTypeX
  );

  concreteResources.forEach((res, index) => {
    const x = resPositions[index];

    nodes.push({
      id: `res-${res.id}`,
      type: "resourceNode",
      position: { x, y: resY },
      data: {
        resource: res,
        onOpen: callbacks.onOpenResource,
      } as ResourceNodeData,
    });

    // Edge from ResourceType to Resource
    edges.push({
      id: `edge-type-${state.selectedResourceTypeId}-res-${res.id}`,
      source: `type-${state.selectedResourceTypeId}`,
      target: `res-${res.id}`,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#10b981",
        width: 12,
        height: 12,
      },
    });
  });

  return { nodes, edges };
}

