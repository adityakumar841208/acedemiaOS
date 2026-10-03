import { RoleType } from "@/models/User";

/**
 * STRICT SERVER-SIDE ROLE-BASED TOOL ACCESS CONTROL
 *
 * Security Principle:
 * - Client-supplied role, studentId, or facultyId parameters are NEVER trusted.
 * - Identity and permissions are derived strictly from the verified session (getCurrentUser()).
 * - If an LLM or user attempts to call a tool outside their authenticated role,
 *   the backend throws an access violation and immediately refuses execution.
 * - All allowed tools are strictly READ-ONLY.
 */

export const ROLE_TOOL_PERMISSIONS: Record<RoleType, readonly string[]> = {
  STUDENT: [
    "getMyAssignments",
    "getMySubmissions",
    "getMySubjects",
    "getMyAttendance",
    "getMyAnnouncements",
  ],
  CR: [
    "getMyAssignments",
    "getMySubmissions",
    "getMySubjects",
    "getMyAttendance",
    "getMyAnnouncements",
  ],
  FACULTY: [
    "getMyFacultyAssignments",
    "getMyAssignedSubjects",
    "getMySubmissionsToGrade",
    "getAssignmentStatistics",
    "getFacultyAnnouncements",
  ],
  ADMIN: [
    "getAcademicOverview",
    "getStudentOverview",
    "getFacultyOverview",
    "getSubjectOverview",
    "getAssignmentOverview",
  ],
} as const;

/**
 * Verifies whether a given tool name is authorized for the given role.
 */
export function isToolAllowedForRole(toolName: string, role: RoleType): boolean {
  if (!role || !ROLE_TOOL_PERMISSIONS[role]) return false;
  return ROLE_TOOL_PERMISSIONS[role].includes(toolName);
}

/**
 * Returns the list of permitted tool names for the role.
 */
export function getAllowedToolsForRole(role: RoleType): string[] {
  if (!role || !ROLE_TOOL_PERMISSIONS[role]) return [];
  return [...ROLE_TOOL_PERMISSIONS[role]];
}
