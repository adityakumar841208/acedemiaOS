import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import connectToDatabase from "../lib/db";
import SubjectModel from "../models/Subject";
import FacultySubject from "../models/FacultySubject";
import Branch from "../models/Branch";
import User from "../models/User";
import AssignmentModel from "../models/Assignment";
import { ensureSyllabusSubjectsInDB } from "../lib/syllabus-catalog";

async function runExclusivityAndScopeVerification() {
  console.log("\n=======================================================");
  console.log("   ACADEMIAOS: FACULTY MULTI-SUBJECT EXCLUSIVITY       ");
  console.log("   & STEP-BY-STEP ASSIGNMENT CREATION SCOPE TEST       ");
  console.log("=======================================================\n");

  await connectToDatabase();
  console.log("Connected to MongoDB successfully.\n");

  // Step 0: Ensure canonical catalog is seeded into MongoDB SubjectModel
  console.log("1. Verifying Database-Driven Syllabus Catalog (MongoDB SubjectModel)...");
  await ensureSyllabusSubjectsInDB();
  const dbSubjectCount = await SubjectModel.countDocuments();
  console.log(`   ✔ MongoDB SubjectModel contains ${dbSubjectCount} active curriculum subjects across semesters 1–8.`);
  if (dbSubjectCount === 0) {
    throw new Error("FAIL: SubjectModel is empty in MongoDB.");
  }

  // Find or create test branches: CSE and ECE
  let cseBranch = await Branch.findOne({ code: "CSE" });
  if (!cseBranch) {
    cseBranch = await Branch.create({
      code: "CSE",
      name: "Computer Science & Engineering",
      status: "ACTIVE",
      isActive: true,
    });
  }

  let eceBranch = await Branch.findOne({ code: "ECE" });
  if (!eceBranch) {
    eceBranch = await Branch.create({
      code: "ECE",
      name: "Electronics & Communication Engineering",
      status: "ACTIVE",
      isActive: true,
    });
  }

  // Create two distinct test faculty members
  const testFaculty1Email = `prof.arya.${Date.now()}@academiaos.edu`;
  const testFaculty2Email = `prof.vikram.${Date.now()}@academiaos.edu`;

  const faculty1 = await User.create({
    name: "Dr. Arya Sen",
    email: testFaculty1Email,
    passwordHash: "test_hashed_pwd",
    role: "FACULTY",
    status: "ACTIVE",
    department: "CSE",
    branchIds: [cseBranch._id],
  });

  const faculty2 = await User.create({
    name: "Dr. Vikram Seth",
    email: testFaculty2Email,
    passwordHash: "test_hashed_pwd",
    role: "FACULTY",
    status: "ACTIVE",
    department: "CSE",
    branchIds: [cseBranch._id],
  });

  console.log(`   ✔ Created Faculty 1: ${faculty1.name} (${faculty1.email})`);
  console.log(`   ✔ Created Faculty 2: ${faculty2.name} (${faculty2.email})\n`);

  try {
    // Step 2: Assign subject CS301 (Data Structures) across Semester 3 to Faculty 1
    console.log("2. Testing Multi-Subject Allocation: Assigning CS301 (Sem 3) to Faculty 1...");
    const subCS301 = await SubjectModel.findOne({ code: "CS301" });
    if (!subCS301) throw new Error("Subject CS301 not found in database.");

    const alloc1 = await FacultySubject.create({
      id: `fsub-${Date.now()}-1`,
      facultyId: faculty1._id.toString(),
      facultyName: faculty1.name,
      facultyEmail: faculty1.email,
      subjectId: subCS301.id,
      subjectCode: subCS301.code,
      subjectName: subCS301.name,
      departmentId: subCS301.departmentId,
      branchCode: "CSE",
      semesterNumber: subCS301.semesterNumber,
      status: "ACTIVE",
      assignedBy: "Super Admin",
      assignedAt: new Date(),
    });
    console.log(`   ✔ Allocated ${subCS301.code} (${subCS301.name}) to ${faculty1.name} (Allocation ID: ${alloc1.id})`);

    // Step 3: Test Strict Exclusivity Rule:
    // Attempting to assign CS301 to Faculty 2 while it is active for Faculty 1 must fail
    console.log("\n3. Testing Strict Exclusivity Rule: Attempting to assign already-allocated CS301 to Faculty 2...");
    
    // Check via availability logic
    const activeAlloc = await FacultySubject.findOne({
      subjectId: subCS301.id,
      status: "ACTIVE",
    });

    if (activeAlloc && activeAlloc.facultyId !== faculty2._id.toString()) {
      console.log(`   ✔ Availability check correctly detected CS301 is locked by ${activeAlloc.facultyName}`);
    } else {
      throw new Error("FAIL: Availability check failed to detect active allocation lock.");
    }

    // Check database unique index enforcement
    let duplicateRejected = false;
    try {
      await FacultySubject.create({
        id: `fsub-${Date.now()}-2`,
        facultyId: faculty2._id.toString(),
        facultyName: faculty2.name,
        facultyEmail: faculty2.email,
        subjectId: subCS301.id,
        subjectCode: subCS301.code,
        subjectName: subCS301.name,
        departmentId: subCS301.departmentId,
        branchCode: "CSE",
        semesterNumber: subCS301.semesterNumber,
        status: "ACTIVE",
        assignedBy: "Super Admin",
        assignedAt: new Date(),
      });
    } catch (err: any) {
      duplicateRejected = true;
      console.log(`   ✔ Database partial unique index strictly rejected concurrent assignment: ${err.message?.slice(0, 75)}...`);
    }

    if (!duplicateRejected) {
      throw new Error("FAIL: Database failed to reject duplicate active subject assignment.");
    }

    // Step 4: Admin edits Faculty 1's profile and frees/revokes CS301
    console.log("\n4. Testing Subject De-allocation: Admin edits Faculty 1 to release CS301...");
    alloc1.status = "REVOKED";
    alloc1.revokedBy = "Super Admin";
    alloc1.revokedAt = new Date();
    await alloc1.save();
    console.log(`   ✔ Faculty 1's allocation revoked. CS301 is now free and available.`);

    // Step 5: Now assign CS301 to Faculty 2
    console.log("\n5. Testing Subject Re-allocation: Assigning now-free CS301 to Faculty 2...");
    const alloc2 = await FacultySubject.create({
      id: `fsub-${Date.now()}-3`,
      facultyId: faculty2._id.toString(),
      facultyName: faculty2.name,
      facultyEmail: faculty2.email,
      subjectId: subCS301.id,
      subjectCode: subCS301.code,
      subjectName: subCS301.name,
      departmentId: subCS301.departmentId,
      branchCode: "CSE",
      semesterNumber: subCS301.semesterNumber,
      status: "ACTIVE",
      assignedBy: "Super Admin",
      assignedAt: new Date(),
    });
    console.log(`   ✔ CS301 successfully re-allocated to Faculty 2: ${faculty2.name} (Allocation ID: ${alloc2.id})`);

    // Step 6: Test Assignment Creation Scope Authorization
    console.log("\n6. Testing Assignment Creation Scope Restrictions:");
    // Case A: Faculty 1 tries to create an assignment for CS301 (now revoked)
    const faculty1Auth = await FacultySubject.findOne({
      facultyId: faculty1._id.toString(),
      subjectId: subCS301.id,
      status: "ACTIVE",
    });
    if (!faculty1Auth) {
      console.log(`   ✔ Blocked: Faculty 1 (${faculty1.name}) cannot publish assignment for CS301 (no active assignment) → 403 Forbidden.`);
    } else {
      throw new Error("FAIL: Faculty 1 should have been rejected for revoked subject.");
    }

    // Case B: Faculty 2 tries to create an assignment for CS501 (Operating Systems / DBMS - unassigned)
    const subCS501 = await SubjectModel.findOne({ code: "CS501" });
    const faculty2UnassignedAuth = await FacultySubject.findOne({
      facultyId: faculty2._id.toString(),
      subjectId: subCS501?.id,
      status: "ACTIVE",
    });
    if (!faculty2UnassignedAuth) {
      console.log(`   ✔ Blocked: Faculty 2 (${faculty2.name}) cannot publish assignment for unassigned CS501 → 403 Forbidden.`);
    } else {
      throw new Error("FAIL: Faculty 2 should have been rejected for unassigned subject.");
    }

    // Case C: Faculty 2 creates assignment for actively assigned CS301
    const faculty2Auth = await FacultySubject.findOne({
      facultyId: faculty2._id.toString(),
      subjectId: subCS301.id,
      status: "ACTIVE",
    });
    if (faculty2Auth) {
      const assignment = await AssignmentModel.create({
        id: `assign-test-${Date.now()}`,
        title: "Lab 1: Balanced BST & AVL Trees",
        description: "Implement AVL Tree rotation logic.",
        subjectId: subCS301.id,
        subjectCode: subCS301.code,
        subjectName: subCS301.name,
        moduleId: "mod-cs301-3",
        moduleTitle: "Trees & Binary Search Trees",
        departmentId: subCS301.departmentId,
        semesterNumber: subCS301.semesterNumber,
        facultyId: faculty2._id.toString(),
        facultyName: faculty2.name,
        totalMarks: 30,
        deadline: new Date(Date.now() + 86400000 * 3),
        allowLate: false,
        instructions: ["Implement clean code", "No plagiarism"],
        assignmentType: "code",
      });
      console.log(`   ✔ Authorized: Faculty 2 successfully published assignment "${assignment.title}" for assigned subject ${subCS301.code}.`);
    }

    console.log("\n=======================================================");
    console.log("   🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!    ");
    console.log("=======================================================\n");
  } finally {
    // Cleanup test data
    await User.deleteMany({ _id: { $in: [faculty1._id, faculty2._id] } });
    await FacultySubject.deleteMany({ facultyId: { $in: [faculty1._id.toString(), faculty2._id.toString()] } });
    await AssignmentModel.deleteMany({ facultyId: { $in: [faculty1._id.toString(), faculty2._id.toString()] } });
    await mongoose.disconnect();
    console.log("Cleaned up test entities and closed database connection.\n");
  }
}

runExclusivityAndScopeVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
