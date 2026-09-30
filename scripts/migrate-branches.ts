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
    email: String,
    role: String,
    status: String,
    department: String,
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    branchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
    semester: Number,
    rollNumber: String,
    facultyProfile: Object,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function migrateBranches() {
  console.log("==========================================");
  console.log("   Migration: Branch System & User Links  ");
  console.log("==========================================");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // 1. Seed or verify baseline branches
  const defaultBranches = [
    {
      code: "CSE",
      name: "Computer Science & Engineering",
      description: "Department of Computer Science and Systems Engineering",
      hodName: "Dr. Arvind Mehra",
      status: "ACTIVE",
      isActive: true,
    },
    {
      code: "ECE",
      name: "Electronics & Communication Engineering",
      description: "Department of Electronics, Telecommunication & VLSI",
      hodName: "Dr. Sunita Rao",
      status: "ACTIVE",
      isActive: true,
    },
    {
      code: "MECH",
      name: "Mechanical Engineering",
      description: "Department of Mechanical Systems, Robotics & Thermal Sciences",
      hodName: "Dr. K. Raman",
      status: "ACTIVE",
      isActive: true,
    },
    {
      code: "EE",
      name: "Electrical Engineering",
      description: "Department of Electrical Power & Energy Systems",
      hodName: "Dr. S. Mukherjee",
      status: "ACTIVE",
      isActive: true,
    },
    {
      code: "CE",
      name: "Civil Engineering",
      description: "Department of Structural, Environmental & Geotechnical Engineering",
      hodName: "Dr. R. Verma",
      status: "ACTIVE",
      isActive: true,
    },
  ];

  const branchMap = new Map<string, any>();

  for (const b of defaultBranches) {
    let branch = await Branch.findOne({ code: b.code });
    if (!branch) {
      branch = await Branch.create(b);
      console.log(`[CREATED] Branch: ${b.code} - ${b.name}`);
    } else {
      console.log(`[EXISTS] Branch: ${b.code} - ${b.name}`);
    }
    branchMap.set(b.code, branch);
  }

  // 2. Link existing users with matching branchId and branchIds
  const users = await User.find({});
  let updatedCount = 0;

  for (const u of users) {
    let modified = false;
    const dept = (u.department || "CSE").toUpperCase();
    const branch = branchMap.get(dept) || branchMap.get("CSE");

    if (branch) {
      if (!u.branchId) {
        u.branchId = branch._id;
        modified = true;
      }

      if (u.role === "FACULTY") {
        if (!u.branchIds || u.branchIds.length === 0) {
          u.branchIds = [branch._id];
          modified = true;
        }
        if (!u.facultyProfile) {
          u.facultyProfile = {
            designation: "Assistant Professor",
            title: "Assistant Professor",
            officeLocation: "",
            phone: "",
            bio: "",
          };
          modified = true;
        }
      }
    }

    if (modified) {
      await u.save();
      updatedCount++;
    }
  }

  console.log(`[COMPLETE] Migrated and linked ${updatedCount} users with branch entities.`);
  await mongoose.disconnect();
  console.log("Done.");
}

migrateBranches().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
