import { RoleType } from "@/models/User";

export type { RoleType };

/**
 * Compact AI Data Transfer Objects (DTOs)
 * Strictly minimal, sanitizing sensitive metadata, passwords, hashes, tokens,
 * and internal database ids.
 */

export interface AssignmentDTO {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  deadline: string;
  totalMarks: number;
  status: "pending" | "submitted" | "graded" | "late";
  submittedAt?: string;
  marks?: number;
  maxMarks?: number;
}

export interface SubmissionDTO {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  subjectName: string;
  submittedAt: string;
  status: "submitted" | "graded" | "late";
  marks?: number;
  maxMarks: number;
  feedback?: string;
}

export interface SubjectDTO {
  code: string;
  name: string;
  credits: number;
  facultyName?: string;
  semesterNumber: number;
  modulesCount: number;
}

export interface AttendanceSubjectBreakdown {
  subjectCode: string;
  subjectName?: string;
  attended: number;
  total: number;
  percentage: number;
}

export interface AttendanceDTO {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  subjects: AttendanceSubjectBreakdown[];
}

export interface AnnouncementDTO {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorRole: string;
  pinned: boolean;
  createdAt: string;
}

export interface FacultyAssignmentDTO {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  deadline: string;
  totalMarks: number;
  semesterNumber: number;
  departmentId: string;
  totalSubmissions?: number;
  pendingCount?: number;
}

export interface FacultySubjectDTO {
  subjectCode: string;
  subjectName: string;
  departmentId: string;
  branchCode: string;
  semesterNumber: number;
  status: string;
}

export interface SubmissionToGradeDTO {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  studentName: string;
  studentRoll: string;
  submittedAt: string;
  status: string;
  maxMarks: number;
}

export interface AssignmentStatsDTO {
  totalAssignments: number;
  totalSubmissions: number;
  gradedCount: number;
  pendingEvaluationCount: number;
  summary: string;
}

export interface AcademicOverviewDTO {
  studentsCount: number;
  facultyCount: number;
  branchesCount: number;
  subjectsCount: number;
  assignmentsCount: number;
}

export interface StudentOverviewDTO {
  totalStudents: number;
  byDepartment: Array<{ department: string; count: number }>;
  bySemester: Array<{ semester: number; count: number }>;
}

export interface FacultyOverviewDTO {
  totalFaculty: number;
  activeAllocationsCount: number;
  byDepartment: Array<{ department: string; count: number }>;
}

export interface SubjectOverviewDTO {
  totalSubjects: number;
  activeSubjectsCount: number;
  assignedCount: number;
  unassignedCount: number;
}

export interface AssignmentOverviewDTO {
  totalAssignments: number;
  totalSubmissions: number;
  gradedCount: number;
  pendingCount: number;
}

/**
 * Groq / OpenAI Compatible Function Calling Schema Interfaces
 */
export interface AIToolParameterProperty {
  type: string;
  description: string;
  enum?: string[];
}

export interface AIToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, AIToolParameterProperty>;
      required?: string[];
    };
  };
}

export interface AssistantMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface ToolCallExecutionResult {
  toolName: string;
  data: any;
  error?: string;
}
