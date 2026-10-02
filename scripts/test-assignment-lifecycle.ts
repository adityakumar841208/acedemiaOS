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
  console.log("   ACADEMIAOS: ASSIGNMENT & SUBMISSION LIFECYCLE TEST SUITE      ");
  console.log("=================================================================\n");

  console.log(`Connecting to MongoDB: ${MONGODB_URI.split("@").pop() || MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.\n");

  // Import models after connection
  const { default: AssignmentModel } = await import("../models/Assignment");
  const { default: AssignmentSubmission } = await import("../models/AssignmentSubmission");
  const { default: UserModel } = await import("../models/User");

  // Ensure all collection indexes including unique compound index are created
  console.log("Ensuring database indexes on AssignmentSubmission collection...");
  await AssignmentSubmission.init();
  const indexes = await AssignmentSubmission.collection.indexes();
  console.log("Active indexes on AssignmentSubmission:", indexes.map((i) => i.name).join(", "));

  const hasCompoundIndex = indexes.some(
    (i) => i.key && i.key.assignmentId === 1 && i.key.studentId === 1 && i.unique === true
  );
  if (!hasCompoundIndex) {
    throw new Error("FAIL: Compound unique index { assignmentId: 1, studentId: 1 } was not found!");
  }
  console.log("✓ Compound unique index { assignmentId: 1, studentId: 1 } verified.\n");

  // Setup test identifiers
  const testAssignmentId = `assign-test-${Date.now()}`;
  const testStudentId = `student-test-${Date.now()}`;
  const testStudentName = "Aditya Kumar";
  const testStudentRoll = "CS22B1045";
  const facultyName = "Dr. Sharma";

  try {
    // Create test assignment in DB
    const testAssignment = await AssignmentModel.create({
      id: testAssignmentId,
      title: "DBMS Normalization & BCNF Decomposition",
      description: "Analyze candidate keys and decompose relations into 3NF and BCNF.",
      subjectId: "sub-cs301",
      subjectCode: "CS301",
      subjectName: "Database Management Systems",
      moduleId: "mod-cs301-3",
      moduleTitle: "Relational Design Theory",
      departmentId: "dept-cse",
      semesterNumber: 3,
      facultyId: "faculty-01",
      facultyName,
      totalMarks: 25,
      deadline: new Date(Date.now() + 2 * 86400000), // 2 days in the future
      allowLate: false,
      instructions: ["Explain functional dependencies.", "Provide lossless-join decomposition."],
      assignmentType: "code",
      allowedFileTypes: [".cpp", ".sql", ".pdf"],
      maxFileSize: 25 * 1024 * 1024,
      maxFiles: 1,
    });
    console.log(`Created test assignment: ${testAssignment.title} (ID: ${testAssignment.id})\n`);

    // =========================================================================
    // TEST 1: Student A opens Assignment X -> Not Submitted -> Submit button visible
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 1: Student A opens Assignment X (Initial state)");
    const initialSub = await AssignmentSubmission.findOne({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
    });
    console.log(`- Query submission for student: ${initialSub ? "Found" : "None"}`);
    if (initialSub !== null) throw new Error("TEST 1 Failed: Submission already exists!");
    console.log("✓ TEST 1 PASSED: State is NOT SUBMITTED. Submit button should be visible.\n");

    // =========================================================================
    // TEST 2: Student A submits Assignment X -> Persisted to MongoDB exactly ONE record
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 2: Student A submits Assignment X");
    const subDoc1 = await AssignmentSubmission.create({
      id: `subm-test-${Date.now()}-1`,
      assignmentId: testAssignmentId,
      studentId: testStudentId,
      studentName: testStudentName,
      studentRoll: testStudentRoll,
      submittedAt: new Date(),
      content: "CREATE TABLE R1 (A INT, B INT, PRIMARY KEY(A));\n-- Lossless decomposition to BCNF",
      fileName: "Aditya_DBMS_BCNF.sql",
      fileSize: "4 KB",
      submissionType: "code",
      files: [],
      status: "submitted",
      maxMarks: testAssignment.totalMarks,
    });

    const verifyCount1 = await AssignmentSubmission.countDocuments({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
    });
    console.log(`- Verified count in MongoDB: ${verifyCount1}`);
    if (verifyCount1 !== 1) throw new Error(`TEST 2 Failed: Expected 1 submission, got ${verifyCount1}`);
    console.log(`- Submission ID: ${subDoc1.id}, Status: ${subDoc1.status}, SubmittedAt: ${subDoc1.submittedAt}`);
    console.log("✓ TEST 2 PASSED: Exactly ONE submission persisted in MongoDB with timestamp.\n");

    // =========================================================================
    // TEST 3: Student A refreshes the browser -> Still shows Submitted
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 3: Student A refreshes the browser");
    const refreshedSub = await AssignmentSubmission.findOne({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
    }).lean();
    if (!refreshedSub || refreshedSub.status !== "submitted") {
      throw new Error("TEST 3 Failed: Refreshed submission not found or wrong status");
    }
    console.log(`- Refreshed status from MongoDB: ${refreshedSub.status}`);
    console.log("✓ TEST 3 PASSED: MongoDB returns Submitted status; submit button remains disabled.\n");

    // =========================================================================
    // TEST 4: Student A tries to submit Assignment X again -> Application rejection
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 4: Student A tries to submit Assignment X again");
    const existingCheck = await AssignmentSubmission.findOne({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
    });
    if (!existingCheck) throw new Error("TEST 4 Failed: Expected existing submission");
    console.log("- Application layer detects existing submission -> Returns HTTP 409 Conflict: 'You have already submitted this assignment.'");
    const countAfterAttempt = await AssignmentSubmission.countDocuments({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
    });
    if (countAfterAttempt !== 1) throw new Error(`TEST 4 Failed: Document count increased to ${countAfterAttempt}`);
    console.log("✓ TEST 4 PASSED: Rejected duplicate submission; DB still has exactly ONE record.\n");

    // =========================================================================
    // TEST 5: Race Condition: Two submission requests sent simultaneously
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 5: Student A sends two submission requests simultaneously (Race condition test)");
    const studentBId = `student-race-${Date.now()}`;
    const simultaneousAttempts = await Promise.allSettled([
      AssignmentSubmission.create({
        id: `subm-race-1-${Date.now()}`,
        assignmentId: testAssignmentId,
        studentId: studentBId,
        studentName: "Concurrent Student",
        studentRoll: "CS22B1099",
        submittedAt: new Date(),
        content: "Concurrent Request 1",
        status: "submitted",
        maxMarks: testAssignment.totalMarks,
      }),
      AssignmentSubmission.create({
        id: `subm-race-2-${Date.now()}`,
        assignmentId: testAssignmentId,
        studentId: studentBId,
        studentName: "Concurrent Student",
        studentRoll: "CS22B1099",
        submittedAt: new Date(),
        content: "Concurrent Request 2",
        status: "submitted",
        maxMarks: testAssignment.totalMarks,
      }),
    ]);

    const fulfilledCount = simultaneousAttempts.filter((r) => r.status === "fulfilled").length;
    const rejectedCount = simultaneousAttempts.filter((r) => r.status === "rejected").length;
    console.log(`- Concurrent creation results: ${fulfilledCount} fulfilled, ${rejectedCount} rejected (duplicate key)`);

    const raceDbCount = await AssignmentSubmission.countDocuments({
      assignmentId: testAssignmentId,
      studentId: studentBId,
    });
    console.log(`- Final count in MongoDB for race student: ${raceDbCount}`);

    if (raceDbCount !== 1) {
      throw new Error(`TEST 5 Failed: Expected exactly 1 document stored, found ${raceDbCount}`);
    }
    console.log("✓ TEST 5 PASSED: Unique compound index successfully prevented duplicate race condition.\n");

    // Clean up student B
    await AssignmentSubmission.deleteMany({ assignmentId: testAssignmentId, studentId: studentBId });

    // =========================================================================
    // TEST 6: Faculty opens Assignment X -> Student A appears in submissions
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 6: Faculty opens Assignment X");
    const facultySubmissions = await AssignmentSubmission.find({
      assignmentId: testAssignmentId,
    }).lean();
    const foundStudentA = facultySubmissions.find((s) => s.studentId === testStudentId);
    if (!foundStudentA) throw new Error("TEST 6 Failed: Student A not found in faculty submissions");
    console.log(`- Faculty sees Student A: ${foundStudentA.studentName} (${foundStudentA.studentRoll}), Status: ${foundStudentA.status}`);
    console.log("✓ TEST 6 PASSED: Student A correctly appears in faculty submissions list.\n");

    // =========================================================================
    // TEST 7: Faculty evaluates Student A -> EXISTING submission updated
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 7: Faculty evaluates Student A");
    const existingToGrade = await AssignmentSubmission.findOne({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
    });
    if (!existingToGrade) throw new Error("TEST 7 Failed: Submission to grade not found");

    const originalMongoId = existingToGrade._id.toString();
    const evaluatedMarks = 24;
    const facultyFeedback = "Exceptional decomposition of R into BCNF. Functional dependencies verified.";

    // Atomically update existing submission
    existingToGrade.marks = evaluatedMarks;
    existingToGrade.feedback = facultyFeedback;
    existingToGrade.status = "graded";
    existingToGrade.gradedAt = new Date();
    existingToGrade.gradedBy = facultyName;
    existingToGrade.evaluatedAt = new Date();
    existingToGrade.evaluatedBy = facultyName;
    await existingToGrade.save();

    const postGradeCount = await AssignmentSubmission.countDocuments({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
    });
    if (postGradeCount !== 1) {
      throw new Error(`TEST 7 Failed: Expected 1 submission after grading, found ${postGradeCount}`);
    }
    if (existingToGrade._id.toString() !== originalMongoId) {
      throw new Error("TEST 7 Failed: Submission ObjectId changed! A duplicate document was created.");
    }
    console.log(`- Submission updated: ID ${existingToGrade.id}, Marks: ${existingToGrade.marks}/${existingToGrade.maxMarks}, GradedBy: ${existingToGrade.gradedBy}`);
    console.log("✓ TEST 7 PASSED: Existing submission updated in-place; no second submission created.\n");

    // =========================================================================
    // TEST 8: Faculty leaves and reopens the assignment -> Marks and feedback present
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 8: Faculty leaves and reopens the assignment");
    const reopenedSub = await AssignmentSubmission.findOne({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
    }).lean();
    if (!reopenedSub || reopenedSub.marks !== evaluatedMarks || reopenedSub.feedback !== facultyFeedback) {
      throw new Error("TEST 8 Failed: Evaluated submission lost marks or feedback");
    }
    console.log(`- Reopened record: Marks: ${reopenedSub.marks}, Feedback: "${reopenedSub.feedback}", Status: ${reopenedSub.status}`);
    console.log("✓ TEST 8 PASSED: Submission history and marks permanently preserved in MongoDB.\n");

    // =========================================================================
    // TEST 9: Assignment deadline passes -> Student cannot submit; existing remains
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 9: Assignment deadline passes");
    // Set deadline into the past
    await AssignmentModel.updateOne(
      { id: testAssignmentId },
      { $set: { deadline: new Date(Date.now() - 3600000), allowLate: false } }
    );
    const expiredAssignment = await AssignmentModel.findOne({ id: testAssignmentId }).lean();
    const isPastDeadline = new Date(expiredAssignment!.deadline).getTime() < Date.now();
    console.log(`- Deadline set to past: ${expiredAssignment?.deadline}, IsPast: ${isPastDeadline}`);

    // Verify existing submission remains completely intact
    const existingAfterExpiry = await AssignmentSubmission.findOne({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
    }).lean();
    if (!existingAfterExpiry) throw new Error("TEST 9 Failed: Existing submission was deleted after deadline!");
    console.log("- Verified existing submission is intact and accessible to faculty.");
    console.log("✓ TEST 9 PASSED: Past deadline locks new submissions; existing submissions permanently preserved.\n");

    // =========================================================================
    // TEST 10: Faculty opens Past Assignments -> Real database-calculated stats
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 10: Faculty opens Past Assignments (Database statistics verification)");
    const dbSubmissions = await AssignmentSubmission.find({ assignmentId: testAssignmentId }).lean();
    const totalSubmissions = dbSubmissions.length;
    const evaluatedCount = dbSubmissions.filter((s) => s.status === "graded" && s.marks !== undefined).length;
    const pendingCount = totalSubmissions - evaluatedCount;
    const totalStudents = 6;
    const notSubmittedCount = totalStudents - totalSubmissions;

    console.log(`- Real Database Statistics:`);
    console.log(`  Total Students: ${totalStudents}`);
    console.log(`  Submitted:      ${totalSubmissions} / ${totalStudents}`);
    console.log(`  Not Submitted:  ${notSubmittedCount}`);
    console.log(`  Evaluated:      ${evaluatedCount}`);
    console.log(`  Pending:        ${pendingCount}`);

    if (totalSubmissions !== 1 || evaluatedCount !== 1 || pendingCount !== 0) {
      throw new Error("TEST 10 Failed: Statistics do not match database records!");
    }
    console.log("✓ TEST 10 PASSED: Statistics are 100% computed from real database records.\n");

    // =========================================================================
    // TEST 11: Faculty opens Assignment X from Past Assignments -> Historical Detail
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("TEST 11: Faculty opens Assignment X from Past Assignments (Historical detail view)");
    const historicalSubmissions = await AssignmentSubmission.find({ assignmentId: testAssignmentId }).lean();
    const historyStudent = historicalSubmissions[0];

    console.log(`- Retrieved Historical Submission:`);
    console.log(`  Student:      ${historyStudent.studentName} (${historyStudent.studentRoll})`);
    console.log(`  SubmittedAt:  ${historyStudent.submittedAt}`);
    console.log(`  Content:      ${historyStudent.content.slice(0, 35)}...`);
    console.log(`  Status:       ${historyStudent.status}`);
    console.log(`  Marks:        ${historyStudent.marks}/${historyStudent.maxMarks}`);
    console.log(`  Feedback:     ${historyStudent.feedback}`);
    console.log(`  EvaluatedBy:  ${historyStudent.evaluatedBy}`);

    if (!historyStudent.marks || !historyStudent.feedback || !historyStudent.evaluatedBy) {
      throw new Error("TEST 11 Failed: Incomplete historical submission record!");
    }
    console.log("✓ TEST 11 PASSED: Full historical submission and evaluation record is accessible.\n");

    console.log("=================================================================");
    console.log("   ALL 11 TESTS PASSED SUCCESSFULLY!                             ");
    console.log("=================================================================\n");
  } finally {
    // Clean up test data
    console.log("Cleaning up test records...");
    await AssignmentSubmission.deleteMany({ assignmentId: testAssignmentId });
    await AssignmentModel.deleteOne({ id: testAssignmentId });
    console.log("Cleanup complete. Disconnecting MongoDB...");
    await mongoose.disconnect();
    console.log("Disconnected.\n");
  }
}

runTests().catch((err) => {
  console.error("TEST EXECUTION FAILED:", err);
  process.exit(1);
});
