export type UserRole = "student" | "cr" | "faculty" | "admin";

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  rollNumber?: string;
  department: string;
  semester?: number;
  title?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  totalSemesters: number;
}

export interface Semester {
  id: string;
  departmentId: string;
  number: number;
  label: string; // e.g. "3rd Semester"
  academicYear: string;
}

export interface Subject {
  id: string;
  departmentId: string;
  semesterNumber: number;
  code: string; // e.g. "CS301"
  name: string; // e.g. "Data Structures & Algorithms"
  facultyId: string;
  facultyName: string;
  credits: number;
  color: string;
  description: string;
  modulesCount: number;
}

export interface Module {
  id: string;
  subjectId: string;
  moduleNumber: number;
  title: string;
  description: string;
  topics: string[];
}

export type ResourceCategory = "ALL" | "NOTES" | "PPT" | "PYQ" | "VIDEO" | "SYLLABUS";

export interface Resource {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  departmentId: string;
  semesterNumber: number;
  category: "NOTES" | "PPT" | "PYQ" | "VIDEO" | "SYLLABUS";
  fileUrl: string;
  fileSize: string;
  fileType: "pdf" | "pptx" | "mp4" | "doc";
  uploadedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  createdAt: string;
  downloadCount: number;
  isVerified: boolean;
  contentSnippet?: string; // Used for in-browser formatted preview
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  moduleId: string;
  moduleTitle: string;
  departmentId: string;
  semesterNumber: number;
  facultyId: string;
  facultyName: string;
  totalMarks: number;
  deadline: string; // ISO string
  allowLate: boolean;
  instructions: string[];
  createdAt: string;
}

export interface SimilarityDetail {
  score: number; // 0 to 100 percentage
  matchedWithSubmissionId: string;
  matchedWithStudentName: string;
  overlappingTokensCount: number;
  matchedPhrases: string[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  submittedAt: string; // ISO string
  content: string;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  status: "submitted" | "graded" | "late";
  marks?: number;
  maxMarks: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  similarity?: SimilarityDetail;
}

export type AnnouncementCategory = "URGENT" | "EXAM" | "ACADEMIC" | "EVENT" | "GENERAL";
export type AnnouncementAudience = "ALL_STUDENTS" | "DEPARTMENT" | "SEMESTER" | "BATCH" | "SPECIFIC_GROUP";
export type TelegramDeliveryStatus = "PENDING" | "SENT" | "FAILED" | "DISABLED";

export interface TelegramDelivery {
  destinationId: string;
  status: TelegramDeliveryStatus;
  messageId?: number;
  chatId?: string;
  sentAt?: string;
  error?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  departmentId: string;
  semesterNumber: number | "ALL";
  authorId: string;
  authorName: string;
  authorRole: "CR" | "FACULTY" | "ADMIN";
  pinned: boolean;
  createdAt: string;
  telegramBroadcasted?: boolean;
  audience?: AnnouncementAudience;
  telegram?: {
    enabled: boolean;
    status: TelegramDeliveryStatus;
    messageId?: number;
    chatId?: string;
    sentAt?: string;
    error?: string;
    deliveries?: TelegramDelivery[];
  };
}

export interface NotificationItem {
  id: string;
  userId?: string;
  targetRole?: UserRole | "ALL";
  title: string;
  message: string;
  type: "assignment" | "announcement" | "grade" | "resource" | "system";
  link?: string;
  isRead: boolean;
  createdAt: string;
}


