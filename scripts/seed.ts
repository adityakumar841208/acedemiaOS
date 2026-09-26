import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Load .env.local if exists
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

// Define inline schema to ensure standalone execution without Next.js path alias issues
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["STUDENT", "CR", "FACULTY", "ADMIN"], required: true },
    status: { type: String, enum: ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"], default: "ACTIVE", required: true },
    department: { type: String, required: true },
    semester: { type: Number },
    rollNumber: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const AssignmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: String,
    description: String,
    subjectId: String,
    subjectCode: String,
    subjectName: String,
    moduleId: String,
    moduleTitle: String,
    departmentId: String,
    semesterNumber: Number,
    facultyId: String,
    facultyName: String,
    totalMarks: Number,
    deadline: Date,
    allowLate: Boolean,
    instructions: [String],
  },
  { timestamps: true }
);
const Assignment = mongoose.models.Assignment || mongoose.model("Assignment", AssignmentSchema);

const ResourceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: String,
    description: String,
    subjectId: String,
    subjectCode: String,
    subjectName: String,
    moduleId: String,
    moduleNumber: Number,
    moduleTitle: String,
    departmentId: String,
    semesterNumber: Number,
    category: String,
    fileUrl: String,
    fileSize: String,
    fileType: String,
    uploadedBy: { id: String, name: String, role: String },
    downloadCount: { type: Number, default: 0 },
    isVerified: Boolean,
    contentSnippet: String,
  },
  { timestamps: true }
);
const Resource = mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);

async function seed() {
  console.log("--------------------------------------------------");
  console.log("   AcademiaOS Database Seeding Process");
  console.log("--------------------------------------------------");
  console.log(`Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connection established.");

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@campus.edu").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPass123!";

  // 1. Seed Admin
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`[IDEMPOTENT] Admin account already exists: ${adminEmail}`);
  } else {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPassword, salt);
    await User.create({
      name: "Dr. Arvind Mehra",
      email: adminEmail,
      passwordHash: hash,
      role: "ADMIN",
      status: "ACTIVE",
      department: "Administration",
      rollNumber: "ADM-001",
    });
    console.log(`[SUCCESS] Created Admin user: ${adminEmail} (Role: ADMIN)`);
  }

  // 2. Seed Optional Demo Accounts for local development & evaluation
  const demoAccounts = [
    {
      name: "Aditya Kumar",
      email: "aditya.student@campus.edu",
      password: process.env.STUDENT_PASSWORD || "StudentPass123!",
      role: "STUDENT",
      department: "CSE",
      semester: 3,
      rollNumber: "CS22B1045",
    },
    {
      name: "Priya Patel",
      email: "priya.cr@campus.edu",
      password: process.env.CR_PASSWORD || "CrPass123!",
      role: "CR",
      department: "CSE",
      semester: 3,
      rollNumber: "CS22B1012",
    },
    {
      name: "Prof. Rajesh Sharma",
      email: "sharma.faculty@campus.edu",
      password: process.env.FACULTY_PASSWORD || "FacultyPass123!",
      role: "FACULTY",
      department: "CSE",
      semester: 3,
      rollNumber: "FAC-108",
    },
  ];

  for (const acc of demoAccounts) {
    const existing = await User.findOne({ email: acc.email });
    if (existing) {
      console.log(`[IDEMPOTENT] Demo account already exists: ${acc.email} (${acc.role})`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(acc.password, salt);
      await User.create({
        name: acc.name,
        email: acc.email,
        passwordHash: hash,
        role: acc.role,
        status: "ACTIVE",
        department: acc.department,
        semester: acc.semester,
        rollNumber: acc.rollNumber,
      });
      console.log(`[SUCCESS] Created Demo account: ${acc.email} (${acc.role})`);
    }
  }

  // 3. Seed academic content in MongoDB. Upserts keep this safe to rerun.
  const faculty = await User.findOne({ email: "sharma.faculty@campus.edu" });
  const facultyId = faculty?._id.toString() || "user-faculty-01";
  const facultyName = faculty?.name || "Prof. Rajesh Sharma";
  const seededAssignments = [
    {
      id: "assign-db-cs301-01",
      title: "Lab 1: Linked List Operations",
      description: "Implement and benchmark singly and doubly linked list operations.",
      subjectId: "sub-cs301",
      subjectCode: "CS301",
      subjectName: "Data Structures & Algorithms",
      moduleId: "mod-cs301-1",
      moduleTitle: "Arrays, Linked Lists & Dynamic Memory",
      departmentId: "dept-cse",
      semesterNumber: 3,
      facultyId,
      facultyName,
      totalMarks: 25,
      deadline: new Date(Date.now() + 7 * 86400000),
      allowLate: false,
      instructions: ["Submit runnable source code.", "Include time and space complexity."],
    },
    {
      id: "assign-db-cs301-02",
      title: "Lab 2: Dijkstra Shortest Path",
      description: "Implement Dijkstra's algorithm using an adjacency list and min-heap.",
      subjectId: "sub-cs301",
      subjectCode: "CS301",
      subjectName: "Data Structures & Algorithms",
      moduleId: "mod-cs301-4",
      moduleTitle: "Graphs & Graph Algorithms",
      departmentId: "dept-cse",
      semesterNumber: 3,
      facultyId,
      facultyName,
      totalMarks: 30,
      deadline: new Date(Date.now() + 14 * 86400000),
      allowLate: false,
      instructions: ["Use an adjacency list.", "Explain complexity in the submission."],
    },
  ];
  for (const assignment of seededAssignments) {
    await Assignment.updateOne({ id: assignment.id }, { $setOnInsert: assignment }, { upsert: true });
  }

  const seededResources = [
    {
      id: "resource-db-cs301-01",
      title: "Module 1: Linked Lists Study Notes",
      description: "Verified notes covering linked list memory layout and operations.",
      subjectId: "sub-cs301",
      subjectCode: "CS301",
      subjectName: "Data Structures & Algorithms",
      moduleId: "mod-cs301-1",
      moduleNumber: 1,
      moduleTitle: "Arrays, Linked Lists & Dynamic Memory",
      departmentId: "dept-cse",
      semesterNumber: 3,
      category: "NOTES",
      fileUrl: "/upload/resources/cs301-module-1-notes.pdf",
      fileSize: "2.4 MB",
      fileType: "pdf",
      uploadedBy: { id: facultyId, name: facultyName, role: "faculty" },
      downloadCount: 0,
      isVerified: true,
      contentSnippet: "# Linked Lists\n\nMemory layout, insertion, deletion, and complexity.",
    },
    {
      id: "resource-db-cs301-02",
      title: "CS301 Previous Year Questions",
      description: "Curated previous year questions organized by module.",
      subjectId: "sub-cs301",
      subjectCode: "CS301",
      subjectName: "Data Structures & Algorithms",
      moduleId: "mod-cs301-4",
      moduleNumber: 4,
      moduleTitle: "Graphs & Graph Algorithms",
      departmentId: "dept-cse",
      semesterNumber: 3,
      category: "PYQ",
      fileUrl: "/upload/resources/cs301-previous-year-questions.pdf",
      fileSize: "1.8 MB",
      fileType: "pdf",
      uploadedBy: { id: facultyId, name: facultyName, role: "faculty" },
      downloadCount: 0,
      isVerified: true,
      contentSnippet: "# Graph Algorithms PYQs\n\nPractice questions grouped by module.",
    },
  ];
  for (const resource of seededResources) {
    await Resource.updateOne({ id: resource.id }, { $setOnInsert: resource }, { upsert: true });
  }

  console.log("--------------------------------------------------");
  console.log("Seeding complete! You can now log in with the above accounts.");
  console.log("--------------------------------------------------");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed with error:", err);
  process.exit(1);
});
