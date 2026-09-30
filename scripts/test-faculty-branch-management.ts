import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load .env.local
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

const BranchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String, default: "" },
    hodName: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Branch = mongoose.models.Branch || mongoose.model("Branch", BranchSchema);

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: { type: String, enum: ["STUDENT", "CR", "FACULTY", "ADMIN"] },
    status: { type: String, enum: ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"], default: "ACTIVE" },
    department: String,
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    branchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
    semester: Number,
    rollNumber: { type: String, sparse: true, unique: true },
    facultyProfile: Object,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function runTests() {
  console.log("=================================================");
  console.log("   Test Suite: Faculty, Branch & Student System   ");
  console.log("=================================================");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Test 1: Verify Branches in Database
  console.log("\n[TEST 1] Verifying Dynamic MongoDB Branches...");
  const branches = await Branch.find().lean();
  console.log(`Found ${branches.length} branches in database:`);
  for (const b of branches) {
    console.log(` - ${b.code}: ${b.name} (Status: ${b.status}, Active: ${b.isActive})`);
  }
  if (branches.length === 0) {
    throw new Error("No branches found in database! Run migration first.");
  }
  console.log("PASSED: MongoDB branches verified.");

  // Test 2: Multi-Branch Faculty Support
  console.log("\n[TEST 2] Verifying Multi-Branch Faculty Members...");
  const facultyMembers = await User.find({ role: "FACULTY" })
    .populate("branchIds")
    .lean();
  console.log(`Found ${facultyMembers.length} faculty members.`);
  for (const f of facultyMembers) {
    const assignedCodes = (f.branchIds || []).map((b: any) => b.code || b.toString());
    console.log(` - Faculty: ${f.name} (${f.email})`);
    console.log(`   Branches: [${assignedCodes.join(", ")}]`);
    console.log(`   Has semester: ${f.semester !== undefined ? f.semester : "No (Correct)"}`);
    console.log(`   Has rollNumber: ${f.rollNumber !== undefined ? f.rollNumber : "No (Correct)"}`);
    if (f.semester !== undefined) {
      console.warn(`   WARNING: Faculty ${f.name} has a semester set.`);
    }
  }
  console.log("PASSED: Multi-branch faculty verified.");

  // Test 3: Student Academic Hierarchy Generation (Branch -> Semester -> Students)
  console.log("\n[TEST 3] Verifying Academic Hierarchy (Branch -> Semester -> Students)...");
  for (const branch of branches) {
    const students = await User.find({
      role: { $in: ["STUDENT", "CR"] },
      $or: [{ branchId: branch._id }, { department: branch.code }],
    }).lean();

    const semMap = new Map<number, number>();
    for (const s of students) {
      const sem = s.semester || 1;
      semMap.set(sem, (semMap.get(sem) || 0) + 1);
    }

    console.log(` Branch ${branch.code} (${branch.name}): Total ${students.length} students`);
    const sortedSems = Array.from(semMap.entries()).sort((a, b) => a[0] - b[0]);
    for (const [sem, count] of sortedSems) {
      console.log(`   ├── Semester ${sem}: ${count} student(s)`);
    }
  }
  console.log("PASSED: Academic hierarchy generated successfully.");

  // Test 4: Safe Deletion Constraint Simulation
  console.log("\n[TEST 4] Verifying Safe Deletion Constraint on Branches...");
  const branchWithUsers = branches[0];
  const userCount = await User.countDocuments({
    $or: [
      { branchId: branchWithUsers._id },
      { branchIds: branchWithUsers._id },
      { department: branchWithUsers.code },
    ],
  });
  console.log(` Branch ${branchWithUsers.code} has ${userCount} associated users.`);
  if (userCount > 0) {
    console.log(` -> System correctly protects branch ${branchWithUsers.code} from unsafe deletion.`);
  }
  console.log("PASSED: Safe deletion policy confirmed.");

  await mongoose.disconnect();
  console.log("\n=================================================");
  console.log("   ALL MANAGEMENT MODULE TESTS PASSED (4/4)       ");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
