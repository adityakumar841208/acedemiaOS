import {
  Department,
  Semester,
  Subject,
  Module,
  Resource,
  Assignment,
  Submission,
  Announcement,
  NotificationItem,
} from "@/types";
import {
  INITIAL_DEPARTMENTS,
  INITIAL_SEMESTERS,
  INITIAL_SUBJECTS,
  INITIAL_MODULES,
  INITIAL_RESOURCES,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
} from "./mock-data";
import { analyzeSimilarity } from "./services/similarity.service";

interface LMSStoreData {
  departments: Department[];
  semesters: Semester[];
  subjects: Subject[];
  modules: Module[];
  resources: Resource[];
  assignments: Assignment[];
  submissions: Submission[];
  announcements: Announcement[];
  notifications: NotificationItem[];
}

// Global variable to survive hot reloads in Next.js development
declare global {
  var __LMS_STORE__: LMSStoreData | undefined;
}

function getInitialStore(): LMSStoreData {
  return {
    departments: [...INITIAL_DEPARTMENTS],
    semesters: [...INITIAL_SEMESTERS],
    subjects: [...INITIAL_SUBJECTS],
    modules: [...INITIAL_MODULES],
    resources: [...INITIAL_RESOURCES],
    assignments: [...INITIAL_ASSIGNMENTS],
    submissions: [...INITIAL_SUBMISSIONS],
    announcements: [...INITIAL_ANNOUNCEMENTS],
    notifications: [...INITIAL_NOTIFICATIONS],
  };
}

if (!global.__LMS_STORE__) {
  global.__LMS_STORE__ = getInitialStore();
}

export const store = {
  // Hierarchy
  getDepartments: () => global.__LMS_STORE__!.departments,
  getSemesters: () => global.__LMS_STORE__!.semesters,
  getSubjects: (deptId?: string, semNumber?: number) => {
    return global.__LMS_STORE__!.subjects.filter((sub) => {
      if (deptId && sub.departmentId !== deptId) return false;
      if (semNumber && sub.semesterNumber !== semNumber) return false;
      return true;
    });
  },
  getSubjectById: (id: string) => {
    return global.__LMS_STORE__!.subjects.find((s) => s.id === id);
  },
  getModules: (subjectId?: string) => {
    return global.__LMS_STORE__!.modules.filter((m) => {
      if (subjectId && m.subjectId !== subjectId) return false;
      return true;
    });
  },

  // Resources
  getResources: (filters?: {
    departmentId?: string;
    semesterNumber?: number;
    subjectId?: string;
    moduleId?: string;
    category?: string;
    search?: string;
  }) => {
    let list = global.__LMS_STORE__!.resources;
    if (!filters) return list;

    if (filters.departmentId && filters.departmentId !== "ALL") {
      list = list.filter((r) => r.departmentId === filters.departmentId);
    }
    if (filters.semesterNumber) {
      list = list.filter((r) => r.semesterNumber === Number(filters.semesterNumber));
    }
    if (filters.subjectId && filters.subjectId !== "ALL") {
      list = list.filter((r) => r.subjectId === filters.subjectId);
    }
    if (filters.moduleId && filters.moduleId !== "ALL") {
      list = list.filter((r) => r.moduleId === filters.moduleId);
    }
    if (filters.category && filters.category !== "ALL") {
      list = list.filter((r) => r.category === filters.category);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.subjectName.toLowerCase().includes(q) ||
          r.moduleTitle.toLowerCase().includes(q)
      );
    }
    return list;
  },
  getResourceById: (id: string) => {
    return global.__LMS_STORE__!.resources.find((r) => r.id === id);
  },
  addResource: (resource: Resource) => {
    global.__LMS_STORE__!.resources.unshift(resource);

    // Auto generate notification
    global.__LMS_STORE__!.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `New Resource: ${resource.title}`,
      message: `${resource.uploadedBy.name} uploaded ${resource.category} for ${resource.subjectCode}`,
      type: "resource",
      link: `/resources`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return resource;
  },
  incrementDownload: (id: string) => {
    const res = global.__LMS_STORE__!.resources.find((r) => r.id === id);
    if (res) res.downloadCount++;
    return res;
  },

  // Assignments
  getAssignments: (subjectId?: string) => {
    if (subjectId) {
      return global.__LMS_STORE__!.assignments.filter((a) => a.subjectId === subjectId);
    }
    return global.__LMS_STORE__!.assignments;
  },
  getAssignmentById: (id: string) => {
    return global.__LMS_STORE__!.assignments.find((a) => a.id === id);
  },
  ensureAssignment: (assignment: Assignment) => {
    const existing = global.__LMS_STORE__!.assignments.find((item) => item.id === assignment.id);
    if (existing) return existing;
    global.__LMS_STORE__!.assignments.unshift(assignment);
    return assignment;
  },
  createAssignment: (assignment: Assignment) => {
    global.__LMS_STORE__!.assignments.unshift(assignment);

    // Broadcast in-app notification
    global.__LMS_STORE__!.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Assignment Posted: ${assignment.title}`,
      message: `Due on ${new Date(assignment.deadline).toLocaleDateString()}`,
      type: "assignment",
      link: `/assignments/${assignment.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return assignment;
  },

  // Submissions & Similarity Analysis
  getSubmissions: (assignmentId?: string, studentId?: string) => {
    return global.__LMS_STORE__!.submissions.filter((sub) => {
      if (assignmentId && sub.assignmentId !== assignmentId) return false;
      if (studentId && sub.studentId !== studentId) return false;
      return true;
    });
  },
  getSubmissionById: (id: string) => {
    return global.__LMS_STORE__!.submissions.find((s) => s.id === id);
  },
  addSubmission: (newSub: Omit<Submission, "id">) => {
    // 1. Verify deadline server-side
    const assignment = global.__LMS_STORE__!.assignments.find((a) => a.id === newSub.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const isPastDeadline = new Date().getTime() > new Date(assignment.deadline).getTime();
    if (isPastDeadline && !assignment.allowLate) {
      throw new Error("Hard deadline has passed. Submissions are permanently locked for this assignment.");
    }

    // 2. Pairwise similarity detection
    const existing = global.__LMS_STORE__!.submissions.filter((s) => s.assignmentId === newSub.assignmentId);
    const similarity = analyzeSimilarity(newSub.content, existing);

    const submission: Submission = {
      ...newSub,
      id: `subm-${Date.now()}`,
      status: isPastDeadline ? "late" : "submitted",
      similarity,
    };

    global.__LMS_STORE__!.submissions.unshift(submission);

    // Notify faculty
    global.__LMS_STORE__!.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `New Submission: ${assignment.subjectCode}`,
      message: `${submission.studentName} submitted ${assignment.title}`,
      type: "assignment",
      link: `/faculty/submissions/${assignment.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return submission;
  },
  gradeSubmission: (
    submissionId: string,
    marks: number,
    feedback: string,
    gradedBy: string
  ) => {
    const sub = global.__LMS_STORE__!.submissions.find((s) => s.id === submissionId);
    if (!sub) throw new Error("Submission not found");

    sub.marks = marks;
    sub.feedback = feedback;
    sub.status = "graded";
    sub.gradedAt = new Date().toISOString();
    sub.gradedBy = gradedBy;

    // Send student feedback notification
    global.__LMS_STORE__!.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: sub.studentId,
      title: `Assignment Graded: ${marks}/${sub.maxMarks}`,
      message: `Your submission for Assignment has been evaluated with feedback: "${feedback.slice(0, 60)}..."`,
      type: "grade",
      link: `/assignments/${sub.assignmentId}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return sub;
  },

  // Announcements & Telegram Dispatch
  getAnnouncements: () => {
    return global.__LMS_STORE__!.announcements;
  },
  createAnnouncement: (announcement: Announcement) => {
    global.__LMS_STORE__!.announcements.unshift(announcement);

    // In-app notification
    global.__LMS_STORE__!.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Announcement: ${announcement.title}`,
      message: `${announcement.authorName} (${announcement.authorRole}) posted an update.`,
      type: "announcement",
      link: `/announcements`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    announcement.telegram = {
      enabled: true,
      status: "PENDING",
      deliveries: [],
    };
    announcement.telegramBroadcasted = false;

    return announcement;
  },
  updateAnnouncementTelegram: (id: string, telegram: NonNullable<Announcement["telegram"]>) => {
    const announcement = global.__LMS_STORE__!.announcements.find((item) => item.id === id);
    if (!announcement) return undefined;
    announcement.telegram = telegram;
    announcement.telegramBroadcasted = telegram.status === "SENT";
    return announcement;
  },

  // Notifications
  getNotifications: () => global.__LMS_STORE__!.notifications,
  markNotificationRead: (id: string) => {
    const notif = global.__LMS_STORE__!.notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
    return notif;
  },
  markAllNotificationsRead: () => {
    global.__LMS_STORE__!.notifications.forEach((n) => (n.isRead = true));
  },

  // Reset / Seed
  resetToDefaults: () => {
    global.__LMS_STORE__ = getInitialStore();
    return { success: true, message: "Database reseeded successfully with mock data." };
  },
};

