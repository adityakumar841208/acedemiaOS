import { RoleType } from "@/models/User";

export const PERMISSIONS = {
  // Assignments
  SUBMIT_ASSIGNMENT: ["STUDENT", "CR"] as RoleType[],
  CREATE_ASSIGNMENT: ["FACULTY", "ADMIN"] as RoleType[],
  GRADE_ASSIGNMENT: ["FACULTY", "ADMIN"] as RoleType[],

  // Resources
  UPLOAD_RESOURCE: ["STUDENT", "CR", "FACULTY", "ADMIN"] as RoleType[],
  DELETE_RESOURCE: ["FACULTY", "ADMIN"] as RoleType[],

  // Announcements
  BROADCAST_ANNOUNCEMENT: ["CR", "FACULTY", "ADMIN"] as RoleType[],

  // Administration
  MANAGE_USERS: ["ADMIN"] as RoleType[],
  MANAGE_SYSTEM: ["ADMIN"] as RoleType[],
};

export function canSubmitAssignment(role: RoleType): boolean {
  return PERMISSIONS.SUBMIT_ASSIGNMENT.includes(role);
}

export function canCreateAssignment(role: RoleType): boolean {
  return PERMISSIONS.CREATE_ASSIGNMENT.includes(role);
}

export function canGradeAssignment(role: RoleType): boolean {
  return PERMISSIONS.GRADE_ASSIGNMENT.includes(role);
}

export function canBroadcastAnnouncement(role: RoleType): boolean {
  return PERMISSIONS.BROADCAST_ANNOUNCEMENT.includes(role);
}

export function canUploadResource(role: RoleType): boolean {
  return PERMISSIONS.UPLOAD_RESOURCE.includes(role);
}

export function canManageAdmin(role: RoleType): boolean {
  return PERMISSIONS.MANAGE_SYSTEM.includes(role);
}

export function getRoleDashboardPath(role: RoleType): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "FACULTY":
      return "/faculty";
    case "CR":
      return "/cr";
    case "STUDENT":
    default:
      return "/dashboard";
  }
}

