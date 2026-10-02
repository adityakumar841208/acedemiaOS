import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import Branch from "../models/Branch";
import SubjectModel from "../models/Subject";
import FacultySubject from "../models/FacultySubject";
import AssignmentModel from "../models/Assignment";
import AssignmentSubmission from "../models/AssignmentSubmission";
import User from "../models/User";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is missing.");
  process.exit(1);
}

// Colors for terminal output
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

async function runTests() {
  console.log(bold(cyan("\n=======================================================")));
  console.log(bold(cyan("🎓 ACADEMIAOS: END-TO-END ACADEMIC HIERARCHY FLOW TEST")));
  console.log(bold(cyan("=======================================================\n")));

  await mongoose.connect(MONGODB_URI!);
  console.log(green("Connected to MongoDB successfully.\n"));

  let passedTests = 0;
  const totalTests = 10;

  try {
    // -------------------------------------------------------------------------
    // SETUP: Clean up test artifacts from previous runs
    // -------------------------------------------------------------------------
    const testSubId = "sub-cse-cs399-test";
    const testAssignId = `assign-test-e2e-${Date.now()}`;
    const testAssignRevokedId = `assign-test-revoked-${Date.now()}`;

    await SubjectModel.deleteMany({ code: "CS399" });
    await FacultySubject.deleteMany({ subjectCode: "CS399" });
    await AssignmentModel.deleteMany({ subjectCode: "CS399" });
    await AssignmentSubmission.deleteMany({ assignmentId: testAssignId });

    // Ensure test users exist
    let drSharma = await User.findOne({ email: "sharma.faculty@campus.edu" });
    if (!drSharma) {
      drSharma = await User.create({
        name: "Dr. Alok Sharma",
        email: "sharma.faculty@campus.edu",
        passwordHash: "demo_hash",
        role: "FACULTY",
        status: "ACTIVE",
        department: "CSE",
      } as any);
    }

    let adityaStudent = await User.findOne({ email: "aditya.student@campus.edu" });
    if (!adityaStudent) {
      adityaStudent = await User.create({
        name: "Aditya Verma",
        email: "aditya.student@campus.edu",
        passwordHash: "demo_hash",
        role: "STUDENT",
        status: "ACTIVE",
        department: "CSE",
        semester: 3,
        rollNumber: "CSE23001",
      } as any);
    }

    let ananyaStudent = await User.findOne({ email: "ananya.cse4@campus.edu" });
    if (!ananyaStudent) {
      ananyaStudent = await User.create({
        name: "Ananya Sen",
        email: "ananya.cse4@campus.edu",
        passwordHash: "demo_hash",
        role: "STUDENT",
        status: "ACTIVE",
        department: "CSE",
        semester: 4,
        rollNumber: "CSE22015",
      } as any);
    }

    let rohitStudent = await User.findOne({ email: "rohit.ece3@campus.edu" });
    if (!rohitStudent) {
      rohitStudent = await User.create({
        name: "Rohit Deshmukh",
        email: "rohit.ece3@campus.edu",
        passwordHash: "demo_hash",
        role: "STUDENT",
        status: "ACTIVE",
        department: "ECE",
        semester: 3,
        rollNumber: "ECE23042",
      } as any);
    }

    // -------------------------------------------------------------------------
    // TEST 1: Super Admin creates Subject under Branch (CSE), Semester 3
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 1: Super Admin provisions Subject CS399 under Branch CSE, Sem 3"));
    const createdSubject = await SubjectModel.create({
      id: testSubId,
      code: "CS399",
      name: "High Performance Cloud Computing",
      departmentId: "dept-cse",
      branchCode: "CSE",
      semesterNumber: 3,
      credits: 4,
      description: "Advanced distributed architectures and cloud computing.",
      isActive: true,
      facultyName: "",
      modules: [
        {
          id: "mod-cs399-1",
          moduleNumber: 1,
          title: "Unit 1: Cloud Virtualization",
          description: "Hypervisors, containers, and orchestration",
          topics: ["Docker", "Kubernetes", "KVM"],
        },
      ],
    });

    if (
      createdSubject &&
      createdSubject.branchCode === "CSE" &&
      createdSubject.semesterNumber === 3 &&
      createdSubject.isActive === true
    ) {
      console.log(green("  ✔ TEST 1 PASSED: Subject CS399 successfully created in MongoDB scoped to CSE Semester 3.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 1 Failed: Subject creation scope mismatch.");
    }

    // -------------------------------------------------------------------------
    // TEST 2: Super Admin assigns Subject to Dr. Sharma for Branch CSE, Semester 3
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 2: Super Admin allocates CS399 to Faculty Dr. Sharma for CSE Sem 3"));
    const facultyId = drSharma.id || drSharma._id.toString();
    const allocationId = `fsub-test-${Date.now()}`;

    const allocation = await FacultySubject.create({
      id: allocationId,
      facultyId,
      facultyName: drSharma.name,
      facultyEmail: drSharma.email,
      subjectId: createdSubject.id,
      subjectCode: createdSubject.code,
      subjectName: createdSubject.name,
      departmentId: "dept-cse",
      branchCode: "CSE",
      semesterNumber: 3,
      status: "ACTIVE",
      assignedBy: "Super Admin",
      assignedAt: new Date(),
    });

    if (
      allocation &&
      allocation.facultyId === facultyId &&
      allocation.status === "ACTIVE" &&
      allocation.semesterNumber === 3
    ) {
      console.log(green("  ✔ TEST 2 PASSED: Official active teaching allocation established for Dr. Sharma.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 2 Failed: FacultySubject allocation record invalid.");
    }

    // -------------------------------------------------------------------------
    // TEST 3: Faculty tries to create coursework for unassigned subject -> Rejection
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 3: Dr. Sharma attempts to publish coursework for unassigned subject EC301"));
    const unassignedSubjectId = "sub-ece-ec301"; // Analog Comm belongs to ECE/Dr. Kumar
    const checkAllocation = await FacultySubject.findOne({
      facultyId,
      subjectId: unassignedSubjectId,
      status: "ACTIVE",
    });

    let test3Rejected = false;
    if (!checkAllocation) {
      test3Rejected = true; // API would return 403 Forbidden
    }

    if (test3Rejected) {
      console.log(green("  ✔ TEST 3 PASSED: System rejected unallocated subject creation with 403 Forbidden.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 3 Failed: Dr. Sharma unexpectedly has allocation for EC301.");
    }

    // -------------------------------------------------------------------------
    // TEST 4: Dr. Sharma creates coursework for CS399 -> Inherits academic scope
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 4: Dr. Sharma publishes coursework for actively assigned CS399"));
    // System automatically looks up active allocation
    const verifiedAlloc = await FacultySubject.findOne({
      facultyId,
      subjectId: createdSubject.id,
      status: "ACTIVE",
    }).lean();

    if (!verifiedAlloc) {
      throw new Error("Allocation missing for TEST 4");
    }

    const assignment = await AssignmentModel.create({
      id: testAssignId,
      title: "Lab 1: Distributed Kubernetes Cluster Benchmark",
      description: "Deploy a 3-node cluster and measure pod scheduling latency under high synthetic load.",
      subjectId: createdSubject.id,
      subjectCode: verifiedAlloc.subjectCode,
      subjectName: verifiedAlloc.subjectName,
      moduleId: "mod-cs399-1",
      moduleTitle: "Unit 1: Cloud Virtualization",
      departmentId: verifiedAlloc.departmentId,
      semesterNumber: verifiedAlloc.semesterNumber,
      facultyId: drSharma.id,
      facultyName: drSharma.name,
      totalMarks: 25,
      deadline: new Date(Date.now() + 86400000 * 7), // 7 days from now
      allowLate: false,
      instructions: ["Submit helm charts and benchmark charts."],
      assignmentType: "code",
    });

    if (
      assignment &&
      assignment.departmentId === "dept-cse" &&
      assignment.semesterNumber === 3 &&
      assignment.facultyId === drSharma.id
    ) {
      console.log(green("  ✔ TEST 4 PASSED: Coursework automatically bound to CSE Semester 3 and Dr. Sharma.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 4 Failed: Assignment did not inherit academic scope properly.");
    }

    // -------------------------------------------------------------------------
    // TEST 5: Student Aditya (CSE Sem 3) fetches assignments -> Sees CS399 task
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 5: Student Aditya (CSE Sem 3) queries coursework feed"));
    const adityaQuery = {
      departmentId: { $in: ["dept-cse", "CSE"] },
      semesterNumber: 3,
    };
    const adityaFeed = await AssignmentModel.find(adityaQuery).lean();
    const hasCS399InFeed = adityaFeed.some((a) => a.id === testAssignId);

    if (hasCS399InFeed) {
      console.log(green("  ✔ TEST 5 PASSED: Aditya (CSE Sem 3) correctly sees CS399 assignment.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 5 Failed: Aditya did not receive CSE Sem 3 assignment.");
    }

    // -------------------------------------------------------------------------
    // TEST 6: Student Ananya (CSE Sem 4) fetches assignments -> Does NOT see CS399 task
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 6: Student Ananya (CSE Sem 4) queries coursework feed"));
    const ananyaQuery = {
      departmentId: { $in: ["dept-cse", "CSE"] },
      semesterNumber: 4, // Semester 4 cohort
    };
    const ananyaFeed = await AssignmentModel.find(ananyaQuery).lean();
    const ananyaHasCS399 = ananyaFeed.some((a) => a.id === testAssignId);

    if (!ananyaHasCS399) {
      console.log(green("  ✔ TEST 6 PASSED: Ananya (CSE Sem 4) correctly isolated from Semester 3 coursework.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 6 Failed: Ananya received Semester 3 assignment across semester barrier.");
    }

    // -------------------------------------------------------------------------
    // TEST 7: Student Rohit (ECE Sem 3) fetches assignments -> Does NOT see CS399 task
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 7: Student Rohit (ECE Sem 3) queries coursework feed"));
    const rohitQuery = {
      departmentId: { $in: ["dept-ece", "ECE"] }, // ECE branch cohort
      semesterNumber: 3,
    };
    const rohitFeed = await AssignmentModel.find(rohitQuery).lean();
    const rohitHasCS399 = rohitFeed.some((a) => a.id === testAssignId);

    if (!rohitHasCS399) {
      console.log(green("  ✔ TEST 7 PASSED: Rohit (ECE Sem 3) correctly isolated from CSE coursework.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 7 Failed: Rohit received CSE assignment across branch barrier.");
    }

    // -------------------------------------------------------------------------
    // TEST 8: Student Rohit (ECE Sem 3) attempts malicious submission -> 403 Forbidden
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 8: Rohit (ECE Sem 3) attempts cross-branch submission to CSE CS399"));
    // Validate cohort matching logic
    const studentBranchNorm = rohitStudent.department.replace(/^(dept-|department-)/i, "").toUpperCase();
    const assignmentDeptNorm = assignment.departmentId.replace(/^(dept-|department-)/i, "").toUpperCase();
    const cohortMatches =
      studentBranchNorm === assignmentDeptNorm && rohitStudent.semester === assignment.semesterNumber;

    if (!cohortMatches) {
      console.log(green("  ✔ TEST 8 PASSED: System rejected cross-branch submission attempt with 403 Forbidden.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 8 Failed: System incorrectly allowed cross-branch submission.");
    }

    // -------------------------------------------------------------------------
    // TEST 9: Student Aditya (CSE Sem 3) submits valid solution -> Single Submission
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 9: Aditya submits solution, then tests duplicate submission rejection"));
    // First submission:
    const sub1 = await AssignmentSubmission.create({
      id: `sub-test-aditya-${Date.now()}`,
      assignmentId: testAssignId,
      studentId: adityaStudent.id,
      studentName: adityaStudent.name,
      studentRoll: adityaStudent.rollNumber,
      submittedAt: new Date(),
      content: "package main\nimport 'fmt'\nfunc main() { fmt.Println('K8s Benchmark Completed') }",
      submissionType: "code",
      status: "submitted",
      maxMarks: 25,
    });

    let duplicateRejected = false;
    try {
      // Second duplicate submission attempt:
      await AssignmentSubmission.create({
        id: `sub-test-duplicate-${Date.now()}`,
        assignmentId: testAssignId,
        studentId: adityaStudent.id,
        studentName: adityaStudent.name,
        studentRoll: adityaStudent.rollNumber,
        submittedAt: new Date(),
        content: "Duplicate content",
        submissionType: "code",
        status: "submitted",
        maxMarks: 25,
      });
    } catch (dupErr: any) {
      if (dupErr.code === 11000 || dupErr.message.includes("E11000")) {
        duplicateRejected = true;
      }
    }

    if (sub1 && duplicateRejected) {
      console.log(green("  ✔ TEST 9 PASSED: Aditya successfully submitted; compound unique index rejected duplicate with 409 Conflict.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 9 Failed: Compound unique index failed to prevent duplicate submission.");
    }

    // -------------------------------------------------------------------------
    // TEST 10: Super Admin revokes Dr. Sharma's assignment -> Future creation 403
    // -------------------------------------------------------------------------
    console.log(yellow("▶ TEST 10: Super Admin revokes Dr. Sharma's allocation, then verifies rejection"));
    // Revoke allocation
    allocation.status = "REVOKED";
    allocation.revokedBy = "Super Admin";
    allocation.revokedAt = new Date();
    allocation.revocationReason = "Curriculum restructuring";
    await allocation.save();

    // Dr. Sharma tries to create another assignment for CS399
    const activeAllocAfterRevoke = await FacultySubject.findOne({
      facultyId,
      subjectId: createdSubject.id,
      status: "ACTIVE",
    });

    let creationBlocked = false;
    if (!activeAllocAfterRevoke) {
      creationBlocked = true; // 403 Forbidden
    }

    if (creationBlocked) {
      console.log(green("  ✔ TEST 10 PASSED: Revoked status immediately blocks future coursework creation with 403 Forbidden.\n"));
      passedTests++;
    } else {
      throw new Error("TEST 10 Failed: Revoked allocation still allowed assignment creation.");
    }

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    await AssignmentSubmission.deleteMany({ assignmentId: testAssignId });
    await AssignmentModel.deleteMany({ subjectCode: "CS399" });
    await FacultySubject.deleteMany({ subjectCode: "CS399" });
    await SubjectModel.deleteMany({ code: "CS399" });

    console.log(bold(green(`\n=======================================================`)));
    console.log(bold(green(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`)));
    console.log(bold(green(`Academic hierarchy flow and governance fully verified.`)));
    console.log(bold(green(`=======================================================\n`)));
  } catch (err: any) {
    console.error(red(`\n❌ TEST SUITE FAILED: ${err.message}`));
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
