export type VaultCategory = "NOTES" | "PPT" | "PYQ" | "LAB" | "SYLLABUS";

export interface VaultDepartment {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  totalSemesters: number;
  totalSubjects: number;
  totalResources: number;
  accentColor: string;
}

export interface VaultSemester {
  id: string;
  departmentId: string;
  number: number;
  label: string;
  academicYear: string;
  subjectCount: number;
  resourceCount: number;
}

export interface VaultSubject {
  id: string;
  departmentId: string;
  semesterNumber: number;
  code: string;
  name: string;
  facultyName: string;
  credits: number;
  modulesCount: number;
  resourceCount: number;
  gradient: string;
  description: string;
}

export interface VaultModule {
  id: string;
  subjectId: string;
  moduleNumber: number;
  title: string;
  description: string;
  topics: string[];
  resourceCount: number;
}

export interface VaultResourceType {
  id: string;
  moduleId: string;
  category: VaultCategory;
  label: string;
  icon: string;
  description: string;
  fileCount: number;
}

export interface VaultResource {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  semesterNumber: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  category: VaultCategory;
  fileUrl: string;
  fileSize: string;
  fileType: "pdf" | "pptx" | "mp4" | "doc";
  uploadedBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  downloadCount: number;
  isVerified: boolean;
  contentSnippet: string;
}

export interface VaultExplorationState {
  selectedDepartmentId: string | null;
  selectedSemesterId: string | null;
  selectedSubjectId: string | null;
  selectedModuleId: string | null;
  selectedResourceTypeId: string | null;
  selectedCategory: VaultCategory | "ALL";
}

// React Flow Custom Node Data Payloads
export interface DepartmentNodeData {
  department: VaultDepartment;
  isSelected: boolean;
  onSelect: (deptId: string) => void;
  [key: string]: unknown;
}

export interface SemesterNodeData {
  semester: VaultSemester;
  isSelected: boolean;
  onSelect: (semId: string) => void;
  [key: string]: unknown;
}

export interface SubjectNodeData {
  subject: VaultSubject;
  isSelected: boolean;
  onSelect: (subjId: string) => void;
  [key: string]: unknown;
}

export interface ModuleNodeData {
  module: VaultModule;
  isSelected: boolean;
  onSelect: (modId: string) => void;
  [key: string]: unknown;
}

export interface ResourceTypeNodeData {
  resourceType: VaultResourceType;
  isSelected: boolean;
  onSelect: (typeId: string) => void;
  [key: string]: unknown;
}

export interface ResourceNodeData {
  resource: VaultResource;
  onOpen: (resourceId: string) => void;
  [key: string]: unknown;
}
