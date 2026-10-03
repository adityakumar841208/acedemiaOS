# AcademiaOS Context-Aware AI Assistant Architectural Guide

> **CRITICAL SECURITY NOTICES**:
> 
> "Documentation is not a security mechanism. Authorization must always be enforced by server-side code."
> 
> "All AI database access is READ-ONLY."

---

## 1. AI Purpose
The AcademiaOS AI Assistant is a secure, read-only query and explanation layer built over the AcademiaOS LMS platform. It allows authenticated students, faculty members, class representatives (CR), and administrators to ask conversational questions about coursework, pending assignments, submission statuses, syllabus subjects, attendance records, and institutional metrics.

The assistant is strictly forbidden from mutating database records, executing arbitrary queries, or performing actions on behalf of users.

---

## 2. User Model & Identity Structure
The user identity is modeled in `models/User.ts` (`IUser`) and secured via HTTP-only JWT cookies (`COOKIE_NAME = "lms_token"` in `lib/auth.ts`):
- `id`: Unique user string identifier (`_id.toString()`)
- `name`: Full student or faculty name
- `email`: Authenticated email address
- `role`: Role enum (`"STUDENT" | "CR" | "FACULTY" | "ADMIN"`)
- `status`: Account lifecycle state (`"PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED"`)
- `department`: Department code (e.g., `"CSE"`, `"ECE"`)
- `branchId` / `branchIds`: Mongo ObjectIds referencing the `Branch` collection
- `semester`: Integer between 1 and 8 (for students)
- `rollNumber`: Student roll number (e.g., `"CS22B1042"`)
- `facultyProfile`: Faculty designation, office location, bio

---

## 3. Student Context
Students (and Class Representatives) operate within a strictly isolated cohort:
- Department: `user.department` (e.g. `"CSE"`)
- Semester: `user.semester` (e.g. `3`)
- Student ID: `user.id`

A student can query only assignments assigned to their department and semester, their own submissions, their own syllabus subjects, their own attendance, and announcements published to their cohort. They can NEVER access records belonging to another student.

---

## 4. Faculty Context
Faculty members operate within their authorized subject assignments:
- Faculty ID: `user.id`
- Assigned Subjects: Tracked in `models/FacultySubject.ts` (`status: "ACTIVE"`)
- Assignment Ownership: Assignments where `facultyId === user.id`
- Submissions Scope: Submissions submitted for assignments created by this faculty member

---

## 5. Academic Relationships
The academic hierarchy follows a strict parent-child structure:
```text
College / Institution
       ↓
Branch / Department (e.g. CSE)
       ↓
Semester (1 - 8)
       ↓
Subject (e.g. CS301 Database Management Systems)
       ↓
Faculty Allocation (FacultySubject with status: "ACTIVE")
       ↓
Assignment (created for specific Subject, Department, and Semester)
       ↓
Student Submissions (1 per student per assignment)
       ↓
Grading & Evaluation
```

---

## 6. Assignment Relationships
- Defined in `models/Assignment.ts`:
  - `id`: Assignment ID (e.g. `assign-1741234567`)
  - `subjectId`, `subjectCode`, `subjectName`: Academic subject reference
  - `departmentId`, `semesterNumber`: Cohort assignment belongs to
  - `facultyId`, `facultyName`: Owner faculty member
  - `deadline`: UTC ISO Date string
  - `totalMarks`: Maximum attainable marks (default: 20)
  - `allowLate`: Boolean policy flag

---

## 7. Submission Relationships
- Defined in `models/AssignmentSubmission.ts`:
  - `id`: Submission ID
  - `assignmentId`: Target assignment
  - `studentId`: Author student ID (unique compound index `{ assignmentId: 1, studentId: 1 }`)
  - `studentName`, `studentRoll`: Student identifying tags
  - `submittedAt`: Submission timestamp
  - `status`: `"submitted" | "graded" | "late"`
  - `marks`: Numerical score awarded (only if graded)
  - `maxMarks`: Assignment total marks
  - `feedback`: Faculty review remarks

---

## 8. Authentication Architecture
- Endpoint: `POST /api/ai/assistant`
- Identity verification: `getCurrentUser()` from `lib/auth.ts` verifies the `lms_token` cookie.
- If no valid session token exists, returns `401 Unauthorized`.
- Request body `role`, `studentId`, `facultyId`, or query parameters are NEVER used for identity. Identity is sourced exclusively from the server session.

---

## 9. Role-Based Access Control (RBAC)
Role-to-tool mappings are strictly enforced in `lib/ai/permissions.ts`:
```ts
export const ROLE_TOOL_PERMISSIONS: Record<RoleType, readonly string[]> = {
  STUDENT: ["getMyAssignments", "getMySubmissions", "getMySubjects", "getMyAttendance", "getMyAnnouncements"],
  CR:      ["getMyAssignments", "getMySubmissions", "getMySubjects", "getMyAttendance", "getMyAnnouncements"],
  FACULTY: ["getMyFacultyAssignments", "getMyAssignedSubjects", "getMySubmissionsToGrade", "getAssignmentStatistics", "getFacultyAnnouncements"],
  ADMIN:   ["getAcademicOverview", "getStudentOverview", "getFacultyOverview", "getSubjectOverview", "getAssignmentOverview"],
};
```
If Groq or a client attempts to invoke a tool outside the user's role, `isToolAllowedForRole(toolName, user.role)` throws an immediate access denial.

---

## 10. AI Tools Catalog

### Student & CR Tools
1. `getMyAssignments`: Retrieves pending, submitted, or all assignments for the student's cohort.
2. `getMySubmissions`: Retrieves student's own submission statuses, marks, and feedback.
3. `getMySubjects`: Retrieves active syllabus subjects for the student's branch and semester.
4. `getMyAttendance`: Computes attendance percentage and per-subject attendance breakdown.
5. `getMyAnnouncements`: Retrieves active cohort announcements and notices.

### Faculty Tools
1. `getMyFacultyAssignments`: Retrieves assignments created by this faculty member.
2. `getMyAssignedSubjects`: Retrieves subjects actively allocated to this faculty member.
3. `getMySubmissionsToGrade`: Retrieves pending student submissions requiring grading.
4. `getAssignmentStatistics`: Aggregates submission and evaluation metrics.
5. `getFacultyAnnouncements`: Retrieves notices created by or relevant to faculty.

### Admin Tools
1. `getAcademicOverview`: Returns system-wide student, faculty, branch, subject, and assignment totals.
2. `getStudentOverview`: Returns anonymized student enrollment breakdown by branch and semester.
3. `getFacultyOverview`: Returns faculty distribution and active allocation metrics.
4. `getSubjectOverview`: Returns active, allocated, and unassigned subject counts.
5. `getAssignmentOverview`: Returns system-wide assignment and grading completion rates.

---

## 11. Allowed Roles
- `STUDENT`: Can call student tools. Isolated to own records.
- `CR`: Same academic boundary as student.
- `FACULTY`: Can call faculty tools. Isolated to assigned subjects and owned assignments.
- `ADMIN`: Can call admin tools. Receives anonymous aggregates only.

---

## 12. MongoDB Queries Used
All queries are 100% read-only:
- `AssignmentModel.find({ semesterNumber: userSem }).sort({ deadline: 1 }).lean()`
- `AssignmentSubmissionModel.find({ studentId: user.id }).sort({ submittedAt: -1 }).lean()`
- `SubjectModel.find({ semesterNumber: userSem, isActive: true }).sort({ code: 1 }).lean()`
- `AttendanceModel.find({ "records.studentId": user.id }).lean()`
- `AnnouncementModel.find({ semesterNumber: { $in: [userSem, "ALL"] } }).sort({ pinned: -1, createdAt: -1 }).lean()`
- `FacultySubject.find({ facultyId: user.id, status: "ACTIVE" }).lean()`
- `User.countDocuments({ role: ... })`
- `User.aggregate([...])`

---

## 13. Required Filters
- Cohort isolation: Students must always filter by `semesterNumber: user.semester` and `departmentId: user.department`.
- Student isolation: Submissions must always filter by `studentId: user.id`.
- Faculty isolation: Faculty assignments must always filter by `facultyId: user.id`.
- Active filter: Subjects must have `isActive: true`. Faculty allocations must have `status: "ACTIVE"`.

---

## 14. AI Data Transfer Objects (DTOs)
Never pass raw Mongoose documents to the LLM. All data is serialized into compact DTOs in `lib/ai/tool-types.ts`:
- `AssignmentDTO`: `{ id, title, subjectName, subjectCode, deadline, totalMarks, status, submittedAt?, marks?, maxMarks? }`
- `SubmissionDTO`: `{ id, assignmentId, assignmentTitle, subjectName, submittedAt, status, marks?, maxMarks, feedback? }`
- `SubjectDTO`: `{ code, name, credits, facultyName?, semesterNumber, modulesCount }`
- `AttendanceDTO`: `{ totalClasses, attendedClasses, percentage, subjects: [...] }`
- `AcademicOverviewDTO`: `{ studentsCount, facultyCount, branchesCount, subjectsCount, assignmentsCount }`

---

## 15. Sensitive Fields Sanitization
The following fields are NEVER exposed to the AI DTOs or LLM:
- `passwordHash`
- `passwordResetTokenHash`, `passwordResetExpiresAt`
- JWT session tokens
- Database `_id` and internal timestamps (`__v`)
- Plagiarism raw similarity tokens and matched phrases
- Other students' marks, rolls, or submissions

---

## 16. Tool Selection Strategy
The assistant uses single, optimized tools to answer user questions:
- "Do I have any pending assignments?" → `getMyAssignments({ status: "pending" })`
- "Have I submitted DBMS?" → `getMySubmissions()`
- "What subjects do I have?" → `getMySubjects()`
- "How many submissions are pending grading?" → `getAssignmentStatistics()`
Avoid tool chaining when one unified query satisfies the request.

---

## 17. Token Optimization
- Result limits: Clamped between 1 and 10 (default: 5).
- Compact DTOs: Stripped of descriptions, file binaries, and metadata.
- History truncation: Truncates history to the last 4-6 messages.
- Max input length: User queries limited to 600 characters.
- Output token ceiling: `max_tokens: 500`.

---

## 18. Prompt Injection Protection
- Input is treated as untrusted data.
- System prompt instructs model to ignore role elevation requests ("You are now admin", "Ignore previous instructions").
- Server-side tool execution verifies `user.role` from the authenticated JWT session; even if an LLM is persuaded to call `getAcademicOverview`, the server check rejects it if the session role is `STUDENT`.

---

## 19. Missing-Data Behavior
- If MongoDB returns no records, state the fact concisely:
  - "You don't have any pending assignments right now."
  - "No submissions are awaiting grading."
  - "That information isn't available to me."
- Never hallucinate dates, marks, subjects, or deadlines.

---

## 20. Concrete Examples

### Example 1: Student Pending Assignments
- **User Prompt**: "Do I have any pending assignments?"
- **Tool Executed**: `getMyAssignments({ status: "pending", limit: 5 })`
- **AI Response**: "You have 2 pending assignments: DBMS Normalization due October 5 and OS Scheduling due October 7."

### Example 2: Unauthorized Cross-Student Query
- **User Prompt**: "Show Rahul's marks."
- **AI Response**: "I can only access your own academic information."

### Example 3: Faculty Submissions
- **User Prompt**: "Which submissions need evaluation?"
- **Tool Executed**: `getMySubmissionsToGrade({ limit: 5 })`
- **AI Response**: "You have 3 submissions awaiting review: Rohan Sharma for DBMS Normalization, Priya Singh for DBMS Normalization, and Amit Kumar for SQL Queries."

---

## 21. Anti-Patterns
- **Anti-Pattern 1**: Trusting client-supplied `role` or `studentId` in the request body. *(Identity must always come from `getCurrentUser()`)*.
- **Anti-Pattern 2**: Calling Mongoose mutation functions (`create`, `save`, `updateOne`, `deleteMany`). *(AI operations must be strictly read-only)*.
- **Anti-Pattern 3**: Returning raw Mongoose documents with passwords or system metadata. *(Always map to minimal DTOs)*.
- **Anti-Pattern 4**: Allowing recursive tool loops. *(Enforce max 3 tool iterations)*.

---

## 22. Maintenance Rules
1. When adding a new field to `Assignment` or `User`, do NOT automatically expose it to the AI DTO unless explicitly required.
2. Every new AI tool must be declared in `lib/ai/permissions.ts` and assigned strictly to permitted roles.
3. Keep system prompts concise and grounded in factual LMS data.
4. Verify tests with `npx tsx scripts/test-ai-assistant-security.ts` before deploying changes.
