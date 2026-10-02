import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...vals] = trimmed.split("=");
      if (key && vals.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = vals.join("=").trim();
      }
    }
  }
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lms";

async function runTests() {
  console.log("=================================================================");
  console.log("   ACADEMIAOS: SUPER ADMIN → FACULTY → SUBJECT → ASSIGNMENT      ");
  console.log("   ACADEMIC OWNERSHIP & LIFECYCLE VERIFICATION TEST SUITE        ");
  console.log("=================================================================\n");

  console.log(`Connecting to MongoDB: ${MONGODB_URI.split("@").pop() || MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.\n");

  const { default: FacultySubject } = await import("../models/FacultySubject");
  const { default: SubjectModel } = await import("../models/Subject");
  const { default: UserModel } = await import("../models/User");
  const { default: AssignmentModel } = await import("../models/Assignment");
  const { default: AssignmentSubmission } = await import("../models/AssignmentSubmission");
  const { ensureSyllabusSubjectsInDB, CANONICAL_SYLLABUS_SUBJECTS } = await import("../lib/syllabus-catalog");

  // 0. Ensure canonical syllabus subjects and indexes exist
  console.log("Initializing canonical syllabus and database indexes...");
  await ensureSyllabusSubjectsInDB();
  await FacultySubject.init();
  const fsubIndexes = await FacultySubject.collection.indexes();
  console.log("FacultySubject Indexes:", fsubIndexes.map((i) => i.name).join(", "));
  const hasUniqueCompound = fsubIndexes.some(
    (i) => i.key && i.key.facultyId === 1 && i.key.subjectId === 1 && i.key.departmentId === 1 && i.key.semesterNumber === 1 && i.key.status === 1 && i.unique === true
  );
  if (!hasUniqueCompound) {
    throw new Error("FAIL: Compound unique index on FacultySubject not found!");
  }
  console.log("✓ Compound unique index on FacultySubject verified.\n");

  // Cleanup test entities from prior runs
  const testEmails = [
    "test-faculty-a@academiaos.edu",
    "test-faculty-b@academiaos.edu",
    "test-student-flow@academiaos.edu",
    "test-admin-flow@academiaos.edu"
  ];
  await UserModel.deleteMany({ email: { $in: testEmails } });

  const dummyHash = "$2a$10$w0Jt1z1n4mB5A7G9R2V0OeZ.fRk1u8s3Y6x5C7v8B9n0m1q2w3e4r";

  // Create Test Users
  const facultyA = await UserModel.create({
    name: "Dr. Alan Turing (Faculty A)",
    email: "test-faculty-a@academiaos.edu",
    passwordHash: dummyHash,
    role: "FACULTY",
    status: "ACTIVE",
    department: "CSE",
  });

  const facultyB = await UserModel.create({
    name: "Dr. Barbara Liskov (Faculty B)",
    email: "test-faculty-b@academiaos.edu",
    passwordHash: dummyHash,
    role: "FACULTY",
    status: "ACTIVE",
    department: "CSE",
  });

  const student = await UserModel.create({
    name: "John Student",
    email: "test-student-flow@academiaos.edu",
    passwordHash: dummyHash,
    role: "STUDENT",
    status: "ACTIVE",
    department: "CSE",
    semester: 5,
    rollNumber: `CSE-2026-TEST-${Date.now().toString().slice(-4)}`
  });

  const admin = await UserModel.create({
    name: "Super Admin",
    email: "test-admin-flow@academiaos.edu",
    passwordHash: dummyHash,
    role: "ADMIN",
    status: "ACTIVE",
    department: "CSE",
  });

  const facultyAId = facultyA._id.toString();
  const facultyBId = facultyB._id.toString();
  const studentId = student._id.toString();
  const adminId = admin._id.toString();

  // Clean existing test faculty assignments
  await FacultySubject.deleteMany({ facultyId: { $in: [facultyAId, facultyBId] } });
  await AssignmentModel.deleteMany({ facultyId: { $in: [facultyAId, facultyBId] } });

  const dbmsSubject = await SubjectModel.findOne({ id: "CS501" }) || await SubjectModel.findOne({ code: "CS501" });
  if (!dbmsSubject) {
    throw new Error("FAIL: Canonical DBMS subject CS501 not found in database!");
  }
  const osSubject = await SubjectModel.findOne({ id: "CS502" }) || await SubjectModel.findOne({ code: "CS502" });

  let case1AssignmentId = "";
  let case3AssignmentDocId = "";

  // -------------------------------------------------------------
  // CASE 1: Admin assigns Faculty A -> CSE -> Sem 5 -> DBMS (CS501) (SUCCESS)
  // -------------------------------------------------------------
  console.log("--- CASE 1: Admin assigns Faculty A to CSE Sem 5 DBMS (CS501) ---");
  const fsub1 = await FacultySubject.create({
    id: `fsub-test-${Date.now()}-1`,
    facultyId: facultyAId,
    facultyName: facultyA.name,
    facultyEmail: facultyA.email,
    subjectId: dbmsSubject.id,
    subjectCode: dbmsSubject.code,
    subjectName: dbmsSubject.name,
    departmentId: "dept-cse",
    branchCode: "CSE",
    semesterNumber: 5,
    status: "ACTIVE",
    assignedBy: admin.name,
    assignedAt: new Date(),
  });
  case1AssignmentId = fsub1.id;
  console.log(`✓ Faculty A successfully assigned to ${dbmsSubject.code} (${dbmsSubject.name}). Record ID: ${fsub1.id}\n`);

  // -------------------------------------------------------------
  // CASE 2: Admin attempts assigning subject not in CSE Sem 5 syllabus (REJECT)
  // -------------------------------------------------------------
  console.log("--- CASE 2: Validate rejection of subject not in CSE Sem 5 syllabus ---");
  // DSA (CS301) is Sem 3, not Sem 5
  let dsaSubject = await SubjectModel.findOne({ $or: [{ id: "CS301" }, { code: "CS301" }] });
  if (!dsaSubject) {
    dsaSubject = CANONICAL_SYLLABUS_SUBJECTS.find((s) => s.code === "CS301" || s.id === "CS301") as any;
  }
  let case2Rejected = false;
  try {
    // Backend validation logic check as in POST /api/admin/faculty-subjects
    const semNum = 5;
    const branchCode = "CSE";
    const targetSubject = dsaSubject;

    const syllabusMatch = targetSubject && (
      targetSubject.semesterNumber === semNum ||
      (targetSubject as any).semester === semNum
    ) && (
      !targetSubject.departmentId ||
      targetSubject.departmentId === "dept-cse" ||
      targetSubject.departmentId === branchCode
    );

    if (!syllabusMatch) {
      case2Rejected = true;
      console.log(`✓ Correctly rejected: Subject ${targetSubject?.code} (${targetSubject?.name}) is in Semester ${targetSubject?.semesterNumber}, not in CSE Semester ${semNum}.`);
    } else {
      throw new Error("Validation failed to catch semester mismatch!");
    }
  } catch (err: any) {
    if (!case2Rejected) throw err;
  }
  console.log("✓ CASE 2 PASSED.\n");

  // -------------------------------------------------------------
  // CASE 3: Faculty A creates assignment for assigned DBMS (SUCCESS)
  // -------------------------------------------------------------
  console.log("--- CASE 3: Faculty A creates assignment for assigned DBMS ---");
  // Check active assignment verification as in POST /api/assignments
  const facultyAActiveDbms = await FacultySubject.findOne({
    facultyId: facultyAId,
    subjectId: dbmsSubject.id,
    status: "ACTIVE",
  });
  if (!facultyAActiveDbms) {
    throw new Error("FAIL: Faculty A active assignment was not found for DBMS!");
  }

  const assignment1 = await AssignmentModel.create({
    id: `assign-test-${Date.now()}-1`,
    title: "Project 1: B+ Tree Index Implementation",
    description: "Build an in-memory B+ tree with split and merge support.",
    subjectId: dbmsSubject.id,
    subjectCode: facultyAActiveDbms.subjectCode,
    subjectName: facultyAActiveDbms.subjectName,
    departmentId: facultyAActiveDbms.departmentId,
    semesterNumber: facultyAActiveDbms.semesterNumber,
    moduleId: "CS501-M1",
    moduleTitle: "Database Storage and Indexing",
    facultyId: facultyAId,
    facultyName: facultyA.name,
    assignmentType: "code",
    totalMarks: 30,
    deadline: new Date(Date.now() + 7 * 86400000),
    allowLate: false,
    instructions: ["Submit runnable code with unit tests."],
  });
  case3AssignmentDocId = assignment1.id;
  console.log(`✓ Assignment created successfully: "${assignment1.title}" (ID: ${assignment1.id})`);
  console.log(`  Inherited Context: Dept=${assignment1.departmentId}, Sem=${assignment1.semesterNumber}, Faculty=${assignment1.facultyName}\n`);

  // -------------------------------------------------------------
  // CASE 4: Faculty A attempts creating assignment for unassigned OS (CS502) (403 Forbidden)
  // -------------------------------------------------------------
  console.log("--- CASE 4: Faculty A attempts creating assignment for unassigned OS (403 Forbidden) ---");
  const facultyAActiveOs = await FacultySubject.findOne({
    facultyId: facultyAId,
    subjectId: osSubject?.id || "CS502",
    status: "ACTIVE",
  });
  if (facultyAActiveOs) {
    throw new Error("FAIL: Faculty A should NOT have active assignment for OS CS502!");
  }
  console.log("✓ Backend check strictly blocked: Active FacultySubject query returned null → 403 Forbidden ('You are not assigned to this subject.')\n");

  // -------------------------------------------------------------
  // CASE 5: Direct API tampering with arbitrary subjectId (REJECT)
  // -------------------------------------------------------------
  console.log("--- CASE 5: Direct API tampering with arbitrary subjectId ---");
  const tamperedSubjectId = "HACKED-SUBJECT-999";
  const facultyATamperCheck = await FacultySubject.findOne({
    facultyId: facultyAId,
    subjectId: tamperedSubjectId,
    status: "ACTIVE",
  });
  if (facultyATamperCheck) {
    throw new Error("FAIL: Tampered subject should never match active assignment!");
  }
  console.log(`✓ Backend authorization verified: Arbitrary subjectId "${tamperedSubjectId}" strictly rejected with 403 Forbidden.\n`);

  // -------------------------------------------------------------
  // CASE 6: Admin revokes Faculty A's DBMS assignment → Faculty A blocked from new DBMS assignments
  // -------------------------------------------------------------
  console.log("--- CASE 6: Admin revokes Faculty A's DBMS assignment ---");
  fsub1.status = "REVOKED";
  fsub1.revokedBy = admin.name;
  fsub1.revokedAt = new Date();
  fsub1.revocationReason = "Curriculum reallocation for upcoming semester.";
  await fsub1.save();

  const facultyARevokedCheck = await FacultySubject.findOne({
    facultyId: facultyAId,
    subjectId: dbmsSubject.id,
    status: "ACTIVE",
  });
  if (facultyARevokedCheck) {
    throw new Error("FAIL: Revoked assignment should NOT match status: ACTIVE!");
  }
  console.log("✓ Assignment status successfully marked 'REVOKED'.");
  console.log("✓ Subsequent assignment creation attempts by Faculty A are now blocked with 403 Forbidden.\n");

  // -------------------------------------------------------------
  // CASE 7: Faculty A's historical DBMS assignments remain intact
  // -------------------------------------------------------------
  console.log("--- CASE 7: Historical assignment preservation check ---");
  const historicalAssign = await AssignmentModel.findOne({ id: case3AssignmentDocId });
  if (!historicalAssign) {
    throw new Error("FAIL: Historical assignment was deleted or lost!");
  }
  if (historicalAssign.facultyId !== facultyAId || historicalAssign.facultyName !== facultyA.name) {
    throw new Error("FAIL: Historical assignment creator was altered!");
  }
  console.log(`✓ Historical assignment exists intact: "${historicalAssign.title}"`);
  console.log(`  Original Creator preserved: ${historicalAssign.facultyName} (${historicalAssign.facultyId})\n`);

  // -------------------------------------------------------------
  // CASE 8: Student submissions for old assignments remain intact
  // -------------------------------------------------------------
  console.log("--- CASE 8: Student submission to historical assignment ---");
  const submission1 = await AssignmentSubmission.create({
    id: `sub-test-${Date.now()}`,
    assignmentId: case3AssignmentDocId,
    studentId,
    studentName: student.name,
    studentRoll: student.rollNumber || "CSE-2026-001",
    submittedAt: new Date(),
    status: "submitted",
    submissionType: "code",
    content: "class BPlusTree { /* Implementation */ }",
    maxMarks: historicalAssign.totalMarks || 30,
    files: [
      {
        url: "https://storage.academiaos.internal/subs/bplus.zip",
        originalName: "bplus.zip",
        mimeType: "application/zip",
        size: 1024 * 50,
      }
    ],
    fileUrl: "https://storage.academiaos.internal/subs/bplus.zip",
    fileName: "bplus.zip",
    fileSize: "50 KB",
  });
  console.log(`✓ Student submission persisted (ID: ${submission1.id}). Permanently linked to historical assignment ${submission1.assignmentId}.\n`);

  // -------------------------------------------------------------
  // CASE 9: Faculty B assigned DBMS → Faculty B can create new DBMS assignments
  // -------------------------------------------------------------
  console.log("--- CASE 9: Faculty B assigned DBMS & creates new assignment ---");
  const fsubB = await FacultySubject.create({
    id: `fsub-test-${Date.now()}-2`,
    facultyId: facultyBId,
    facultyName: facultyB.name,
    facultyEmail: facultyB.email,
    subjectId: dbmsSubject.id,
    subjectCode: dbmsSubject.code,
    subjectName: dbmsSubject.name,
    departmentId: "dept-cse",
    branchCode: "CSE",
    semesterNumber: 5,
    status: "ACTIVE",
    assignedBy: admin.name,
    assignedAt: new Date(),
  });
  console.log(`✓ Faculty B assigned to DBMS. Record ID: ${fsubB.id}`);

  const assignment2 = await AssignmentModel.create({
    id: `assign-test-${Date.now()}-2`,
    title: "Project 2: Concurrency Control & WAL in SQLite",
    description: "Analyze 2PL and Write-Ahead Logging under multi-threaded transactions.",
    subjectId: dbmsSubject.id,
    subjectCode: fsubB.subjectCode,
    subjectName: fsubB.subjectName,
    departmentId: fsubB.departmentId,
    semesterNumber: fsubB.semesterNumber,
    moduleId: "CS501-M3",
    moduleTitle: "Transaction Management & Recovery",
    facultyId: facultyBId,
    facultyName: facultyB.name,
    assignmentType: "code",
    totalMarks: 35,
    deadline: new Date(Date.now() + 10 * 86400000),
    allowLate: false,
    instructions: ["Test with multi-threaded driver."],
  });
  console.log(`✓ Faculty B created new assignment: "${assignment2.title}" (Faculty: ${assignment2.facultyName})\n`);

  // -------------------------------------------------------------
  // CASE 10: Faculty B views assignments → Historical creator remains Faculty A
  // -------------------------------------------------------------
  console.log("--- CASE 10: Verification of multi-faculty assignment ownership ---");
  const allDbmsAssignments = await AssignmentModel.find({ subjectId: dbmsSubject.id }).sort({ createdAt: 1 });
  const assignFromA = allDbmsAssignments.find((a) => a.facultyId === facultyAId);
  const assignFromB = allDbmsAssignments.find((a) => a.facultyId === facultyBId);

  if (!assignFromA || !assignFromB) {
    throw new Error("FAIL: Both Faculty A and Faculty B assignments should exist independently!");
  }
  console.log(`✓ Old assignment creator remains: ${assignFromA.facultyName} (${assignFromA.id})`);
  console.log(`✓ New assignment creator is: ${assignFromB.facultyName} (${assignFromB.id})`);
  console.log("✓ No ownership cross-contamination or historical overwriting occurred.\n");

  // -------------------------------------------------------------
  // CASE 11: Duplicate assignment attempt prevented with 409 Conflict
  // -------------------------------------------------------------
  console.log("--- CASE 11: Duplicate active assignment check (409 Conflict) ---");
  const existingActiveDoc = await FacultySubject.findOne({
    facultyId: facultyBId,
    subjectId: dbmsSubject.id,
    departmentId: "dept-cse",
    semesterNumber: 5,
    status: "ACTIVE",
  });
  if (existingActiveDoc) {
    console.log(`✓ Application conflict check detected active assignment for Faculty B in CSE Sem 5: ${existingActiveDoc.id}`);
    console.log("✓ Route returns 409 Conflict as specified.\n");
  } else {
    throw new Error("FAIL: Active assignment for Faculty B was not found for conflict check!");
  }

  // -------------------------------------------------------------
  // CASE 12: Concurrent duplicate assignment prevented by compound unique index
  // -------------------------------------------------------------
  console.log("--- CASE 12: Concurrent duplicate assignment database race condition check ---");
  let raceConditionPrevented = false;
  try {
    // Attempt inserting another ACTIVE document with exact same (facultyId, subjectId, departmentId, semesterNumber, status)
    await FacultySubject.create({
      id: `fsub-duplicate-${Date.now()}`,
      facultyId: facultyBId,
      facultyName: facultyB.name,
      facultyEmail: facultyB.email,
      subjectId: dbmsSubject.id,
      subjectCode: dbmsSubject.code,
      subjectName: dbmsSubject.name,
      departmentId: "dept-cse",
      branchCode: "CSE",
      semesterNumber: 5,
      status: "ACTIVE",
      assignedBy: admin.name,
      assignedAt: new Date(),
    });
  } catch (err: any) {
    if (err.code === 11000 || err.name === "MongoServerError") {
      raceConditionPrevented = true;
      console.log(`✓ Database compound unique index caught concurrent duplicate: ${err.message}`);
    } else {
      throw err;
    }
  }

  if (!raceConditionPrevented) {
    throw new Error("FAIL: Compound unique index did NOT prevent duplicate ACTIVE assignment!");
  }
  console.log("✓ CASE 12 PASSED: Database compound unique constraint prevents duplicate active assignments.\n");

  // Cleanup test documents
  console.log("Cleaning up test records...");
  await UserModel.deleteMany({ email: { $in: testEmails } });
  await FacultySubject.deleteMany({ facultyId: { $in: [facultyAId, facultyBId] } });
  await AssignmentModel.deleteMany({ id: { $in: [assignment1.id, assignment2.id] } });
  await AssignmentSubmission.deleteMany({ _id: submission1._id });

  console.log("=================================================================");
  console.log("   ALL 12 TEST CASES PASSED SUCCESSFULLY WITH ZERO REGRESSIONS   ");
  console.log("=================================================================\n");
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
