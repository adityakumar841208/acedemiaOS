import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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

async function seedAcademic() {
  console.log("===============================================================");
  console.log("   ACADEMIAOS: ACADEMIC MASTER DATA & COHORT SEEDING PROCESS   ");
  console.log("===============================================================\n");

  console.log(`Connecting to MongoDB: ${MONGODB_URI.split("@").pop() || MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.\n");

  const { default: Branch } = await import("../models/Branch");
  const { default: SubjectModel } = await import("../models/Subject");
  const { default: UserModel } = await import("../models/User");
  const { default: FacultySubject } = await import("../models/FacultySubject");
  const { default: Assignment } = await import("../models/Assignment");
  const { default: AssignmentSubmission } = await import("../models/AssignmentSubmission");

  // 1. SEED ACADEMIC BRANCHES (COLLEGE -> BRANCH)
  console.log("Step 1: Seeding Academic Branches...");
  const branchDefinitions = [
    {
      code: "CSE",
      name: "Computer Science & Engineering",
      description: "Department of Computing, Systems, and Software Intelligence",
      hodName: "Prof. N. K. Subramanian",
      status: "ACTIVE" as const,
      isActive: true,
    },
    {
      code: "ECE",
      name: "Electronics & Communication Engineering",
      description: "Department of Microelectronics, Communications, and Signal Systems",
      hodName: "Dr. Sunita Deshmukh",
      status: "ACTIVE" as const,
      isActive: true,
    },
    {
      code: "EE",
      name: "Electrical Engineering",
      description: "Department of Power Systems, Energy, and Control Engineering",
      hodName: "Dr. K. R. Raghavan",
      status: "ACTIVE" as const,
      isActive: true,
    },
    {
      code: "ME",
      name: "Mechanical Engineering",
      description: "Department of Thermal Engineering, Fluidics, and Machine Design",
      hodName: "Prof. Anand Joshi",
      status: "ACTIVE" as const,
      isActive: true,
    },
  ];

  const branchMap: Record<string, any> = {};
  for (const b of branchDefinitions) {
    const doc = await Branch.findOneAndUpdate(
      { code: b.code },
      { $set: b },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    branchMap[b.code] = doc;
    console.log(`  ✓ Branch: ${b.code} - ${b.name} (ID: ${doc._id})`);
  }
  console.log();

  // 2. SEED SUBJECTS BY (BRANCH + SEMESTER)
  console.log("Step 2: Seeding Academic Subjects (Branch + Semester Scoped)...");

  interface SeedSubject {
    branchCode: string;
    semesterNumber: number;
    code: string;
    name: string;
    credits: number;
    description: string;
    modules: Array<{
      moduleNumber: number;
      title: string;
      description: string;
      topics: string[];
    }>;
  }

  const subjectDefinitions: SeedSubject[] = [
    // -------------------------------------------------------------
    // CSE: Semesters 1, 2, 3, 4
    // -------------------------------------------------------------
    // Sem 1
    {
      branchCode: "CSE",
      semesterNumber: 1,
      code: "CS101",
      name: "Engineering Mathematics-I",
      credits: 4,
      description: "Differential and integral calculus, linear algebra, vector calculus and matrices.",
      modules: [
        { moduleNumber: 1, title: "Matrices & Linear Systems", description: "Matrix rank, eigenvalues and eigenvectors, Cayley-Hamilton theorem.", topics: ["Rank of Matrix", "Eigenvalues", "Diagonalization"] },
        { moduleNumber: 2, title: "Differential Calculus", description: "Partial derivatives, Taylor series, maxima and minima of several variables.", topics: ["Partial Derivatives", "Euler Theorem", "Jacobians"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 1,
      code: "CS102",
      name: "Programming Fundamentals in C",
      credits: 4,
      description: "Imperative programming, memory addresses, pointers, arrays, structures, and file I/O in C.",
      modules: [
        { moduleNumber: 1, title: "Basic Syntax & Control Flow", description: "Types, expressions, conditionals, iteration.", topics: ["Variables", "Loops", "Functions"] },
        { moduleNumber: 2, title: "Pointers & Dynamic Memory", description: "Pointer arithmetic, dynamic allocation with malloc/free.", topics: ["Pointers", "Dynamic Memory", "Structs"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 1,
      code: "CS103",
      name: "Engineering Physics",
      credits: 4,
      description: "Electromagnetism, quantum mechanics, laser physics, and fiber optics.",
      modules: [
        { moduleNumber: 1, title: "Optics & Interference", description: "Wave optics, interference, diffraction, lasers.", topics: ["Interference", "Diffraction", "Lasers"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 1,
      code: "CS104",
      name: "Basic Electrical Engineering",
      credits: 3,
      description: "DC circuits, AC circuits, transformers, and electrical machines fundamentals.",
      modules: [
        { moduleNumber: 1, title: "DC Circuit Theorems", description: "Mesh analysis, nodal analysis, Thevenin and Norton theorems.", topics: ["Ohm's Law", "Thevenin Theorem", "Nodal Analysis"] },
      ],
    },

    // Sem 2
    {
      branchCode: "CSE",
      semesterNumber: 2,
      code: "CS201",
      name: "Engineering Mathematics-II",
      credits: 4,
      description: "Complex variables, ordinary differential equations, Laplace transforms and Fourier series.",
      modules: [
        { moduleNumber: 1, title: "Ordinary Differential Equations", description: "First and second order linear ODEs.", topics: ["First-Order ODEs", "Homogeneous Equations"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 2,
      code: "CS202",
      name: "Data Structures & Algorithms",
      credits: 4,
      description: "Linear data structures, trees, binary heaps, sorting and searching algorithms.",
      modules: [
        { moduleNumber: 1, title: "Linear Data Structures", description: "Arrays, stacks, queues, linked lists.", topics: ["Stacks", "Queues", "Linked Lists"] },
        { moduleNumber: 2, title: "Trees & Graphs", description: "Binary trees, BST, BFS and DFS traversals.", topics: ["Binary Search Tree", "Graph Traversals"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 2,
      code: "CS203",
      name: "Digital Logic & Computer Design",
      credits: 4,
      description: "Boolean algebra, logic gates, combinational and sequential logic circuits.",
      modules: [
        { moduleNumber: 1, title: "Combinational Circuits", description: "Karnaugh maps, multiplexers, decoders, full adders.", topics: ["K-Maps", "Multiplexers", "Adders"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 2,
      code: "CS204",
      name: "Object Oriented Programming (Java)",
      credits: 4,
      description: "OOP principles, JVM architecture, inheritance, polymorphism, and Java collections.",
      modules: [
        { moduleNumber: 1, title: "OOP Paradigm & Encapsulation", description: "Classes, objects, constructors, access modifiers.", topics: ["Encapsulation", "Constructors", "Static vs Instance"] },
      ],
    },

    // Sem 3
    {
      branchCode: "CSE",
      semesterNumber: 3,
      code: "CS301",
      name: "Database Management Systems",
      credits: 4,
      description: "Relational data model, ER diagrams, SQL, normalization (1NF-BCNF), and transaction ACID properties.",
      modules: [
        { moduleNumber: 1, title: "Relational Model & SQL", description: "Relational algebra, DDL, DML, complex joins.", topics: ["ER Diagrams", "Complex Joins", "Aggregations"] },
        { moduleNumber: 2, title: "Normalization & Schema Design", description: "Functional dependencies, 1NF, 2NF, 3NF, BCNF decomposition.", topics: ["Functional Dependencies", "3NF", "BCNF"] },
        { moduleNumber: 3, title: "Transactions & Concurrency", description: "ACID properties, serializability, two-phase locking (2PL).", topics: ["ACID Properties", "2PL Protocol", "Deadlocks"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 3,
      code: "CS302",
      name: "Operating Systems",
      credits: 4,
      description: "Process management, CPU scheduling, thread synchronization, virtual memory, and file systems.",
      modules: [
        { moduleNumber: 1, title: "Processes & Scheduling", description: "Process lifecycle, PCB, FCFS, SJF, Round Robin.", topics: ["PCB", "Context Switch", "CPU Scheduling"] },
        { moduleNumber: 2, title: "Memory & Virtual Memory", description: "Paging, segmentation, page faults, LRU replacement.", topics: ["Paging", "Page Faults", "LRU Cache"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 3,
      code: "CS303",
      name: "Computer Networks",
      credits: 4,
      description: "OSI & TCP/IP stack, socket programming, IP routing protocols, TCP congestion control.",
      modules: [
        { moduleNumber: 1, title: "Network Architecture & Data Link", description: "Layered models, packet switching, framing, CRC, CSMA/CD.", topics: ["OSI Model", "TCP/IP", "Framing & CRC"] },
        { moduleNumber: 2, title: "Routing & Transport Protocols", description: "IPv4/IPv6, subnetting, Dijkstra routing, TCP vs UDP.", topics: ["Subnetting", "Routing Algorithms", "TCP Congestion"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 3,
      code: "CS304",
      name: "Computer Organization & Architecture",
      credits: 3,
      description: "Instruction set design, ALU structure, pipeline hazards, and cache memory hierarchies.",
      modules: [
        { moduleNumber: 1, title: "Instruction Cycle & Pipelining", description: "RISC vs CISC, pipeline hazards, branch prediction.", topics: ["Instruction Cycle", "Pipelining", "Cache Levels"] },
      ],
    },

    // Sem 4
    {
      branchCode: "CSE",
      semesterNumber: 4,
      code: "CS401",
      name: "Software Engineering & Agile Methods",
      credits: 4,
      description: "SDLC methodologies, Agile, Scrum, requirements engineering, design patterns, and unit testing.",
      modules: [
        { moduleNumber: 1, title: "Agile & SDLC Models", description: "Scrum ceremonies, user stories, Sprint planning, Kanban.", topics: ["Scrum Framework", "User Stories", "CI/CD"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 4,
      code: "CS402",
      name: "Web Technology & Full-Stack Development",
      credits: 4,
      description: "Modern web architecture, REST APIs, TypeScript, asynchronous I/O, and secure session management.",
      modules: [
        { moduleNumber: 1, title: "Client-Server Protocols & APIs", description: "HTTP/HTTPS, RESTful design, JSON web tokens, CORS.", topics: ["REST APIs", "JWT Auth", "Async Programming"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 4,
      code: "CS403",
      name: "Theory of Computation & Automata",
      credits: 4,
      description: "Finite state automata, regular expressions, context-free grammars, Turing machines, and decidability.",
      modules: [
        { moduleNumber: 1, title: "Finite Automata & Regular Languages", description: "DFA, NFA, subset construction, pumping lemma.", topics: ["DFA & NFA", "Regular Expressions", "Pumping Lemma"] },
      ],
    },
    {
      branchCode: "CSE",
      semesterNumber: 4,
      code: "CS404",
      name: "Design & Analysis of Algorithms",
      credits: 4,
      description: "Asymptotic notation, divide-and-conquer, greedy algorithms, dynamic programming, NP-completeness.",
      modules: [
        { moduleNumber: 1, title: "Divide & Conquer & Greedy Strategy", description: "Recurrence relations, Master theorem, Huffman coding.", topics: ["Master Theorem", "Greedy Choice", "Dijkstra"] },
        { moduleNumber: 2, title: "Dynamic Programming", description: "Optimal substructure, overlapping subproblems, memoization.", topics: ["0/1 Knapsack", "LCS", "Matrix Chain"] },
      ],
    },

    // -------------------------------------------------------------
    // ECE: Semesters 1, 2, 3, 4
    // -------------------------------------------------------------
    {
      branchCode: "ECE",
      semesterNumber: 1,
      code: "EC101",
      name: "Engineering Mathematics-I (ECE)",
      credits: 4,
      description: "Calculus, linear algebra, and complex numbers for electronic signals.",
      modules: [{ moduleNumber: 1, title: "Linear Algebra & Matrices", description: "Eigenvectors and linear transformations.", topics: ["Matrices", "Eigenvalues"] }],
    },
    {
      branchCode: "ECE",
      semesterNumber: 2,
      code: "EC201",
      name: "Electronic Devices & Circuit Analysis",
      credits: 4,
      description: "PN junction diodes, BJT characteristics, MOSFET biasing, and small-signal amplifiers.",
      modules: [{ moduleNumber: 1, title: "Semiconductors & Diodes", description: "Energy bands, carrier concentration, diode equations.", topics: ["PN Junction", "Zener Diode", "Rectifiers"] }],
    },
    {
      branchCode: "ECE",
      semesterNumber: 3,
      code: "EC301",
      name: "Analog Communication Systems",
      credits: 4,
      description: "Amplitude modulation (AM, DSB, SSB), frequency modulation (FM), phase modulation, and superheterodyne receivers.",
      modules: [{ moduleNumber: 1, title: "Amplitude & Frequency Modulation", description: "AM and FM generation and demodulation circuits.", topics: ["AM Modulation", "FM Spectrum", "Superheterodyne Receiver"] }],
    },
    {
      branchCode: "ECE",
      semesterNumber: 3,
      code: "EC302",
      name: "Signals & Linear Systems",
      credits: 4,
      description: "Continuous and discrete-time signals, LTI systems, convolution, Fourier transform, and Z-transform.",
      modules: [{ moduleNumber: 1, title: "LTI Systems & Convolution", description: "Impulse response, convolution integrals, and stability.", topics: ["LTI Systems", "Convolution", "Fourier Transform"] }],
    },
    {
      branchCode: "ECE",
      semesterNumber: 4,
      code: "EC401",
      name: "Digital Communication & Information Theory",
      credits: 4,
      description: "Pulse code modulation (PCM), delta modulation, digital shift keying (ASK, FSK, PSK, QAM).",
      modules: [{ moduleNumber: 1, title: "Digital Modulation Schemes", description: "BPSK, QPSK, QAM constellation diagrams.", topics: ["PCM", "QPSK", "Constellation Diagrams"] }],
    },
    {
      branchCode: "ECE",
      semesterNumber: 4,
      code: "EC402",
      name: "Microcontrollers & Embedded Systems",
      credits: 4,
      description: "ARM Cortex architecture, 8051 timers, interrupt service routines, and I2C/SPI interfaces.",
      modules: [{ moduleNumber: 1, title: "ARM Architecture & Peripherals", description: "GPIO, ADC, PWM, serial communication protocols.", topics: ["ARM Cortex", "Timers & Interrupts", "SPI & I2C"] }],
    },

    // -------------------------------------------------------------
    // EE: Semesters 1, 2, 3, 4
    // -------------------------------------------------------------
    {
      branchCode: "EE",
      semesterNumber: 1,
      code: "EE101",
      name: "Electrical Circuit Analysis",
      credits: 4,
      description: "Network theorems, transient analysis of RL/RC circuits, and resonance.",
      modules: [{ moduleNumber: 1, title: "Network Theorems", description: "Superposition, Reciprocity, Maximum Power Transfer.", topics: ["Superposition", "Thevenin", "Resonance"] }],
    },
    {
      branchCode: "EE",
      semesterNumber: 2,
      code: "EE201",
      name: "Electromagnetic Fields & Waves",
      credits: 4,
      description: "Electrostatics, magnetostatics, Maxwell equations, and plane wave propagation.",
      modules: [{ moduleNumber: 1, title: "Maxwell Equations", description: "Gauss law, Ampere law, Faraday induction.", topics: ["Electrostatics", "Maxwell Equations"] }],
    },
    {
      branchCode: "EE",
      semesterNumber: 3,
      code: "EE301",
      name: "Electrical Machines-I",
      credits: 4,
      description: "Single-phase and three-phase transformers, DC generators, and DC motors.",
      modules: [{ moduleNumber: 1, title: "Transformers & DC Motors", description: "Equivalent circuit, voltage regulation, speed control of DC motors.", topics: ["Transformers", "DC Machines", "Speed Control"] }],
    },
    {
      branchCode: "EE",
      semesterNumber: 4,
      code: "EE401",
      name: "Control Systems Engineering",
      credits: 4,
      description: "Transfer functions, block diagram reduction, Routh-Hurwitz stability, root locus, and Bode plots.",
      modules: [{ moduleNumber: 1, title: "Stability Analysis & Root Locus", description: "Bode plots, Nyquist criterion, PID controller tuning.", topics: ["Transfer Functions", "Root Locus", "Bode Plot"] }],
    },

    // -------------------------------------------------------------
    // ME: Semesters 1, 2, 3, 4
    // -------------------------------------------------------------
    {
      branchCode: "ME",
      semesterNumber: 1,
      code: "ME101",
      name: "Engineering Mechanics & Statics",
      credits: 4,
      description: "Force systems, equilibrium of rigid bodies, friction, trusses, and centroids.",
      modules: [{ moduleNumber: 1, title: "Equilibrium & Trusses", description: "Method of joints, method of sections, free body diagrams.", topics: ["Equilibrium", "Trusses", "Friction"] }],
    },
    {
      branchCode: "ME",
      semesterNumber: 2,
      code: "ME201",
      name: "Thermodynamics & Heat Engines",
      credits: 4,
      description: "First and second laws of thermodynamics, entropy, Carnot cycle, and Rankine cycle.",
      modules: [{ moduleNumber: 1, title: "First & Second Laws", description: "Closed and open system energy equations, entropy generation.", topics: ["First Law", "Carnot Cycle", "Entropy"] }],
    },
    {
      branchCode: "ME",
      semesterNumber: 3,
      code: "ME301",
      name: "Fluid Mechanics & Hydraulic Machinery",
      credits: 4,
      description: "Fluid statics, Bernoulli equation, Navier-Stokes, boundary layer theory, and centrifugal pumps.",
      modules: [{ moduleNumber: 1, title: "Fluid Dynamics & Bernoulli", description: "Continuity, momentum, energy equations, flow measurement.", topics: ["Bernoulli Equation", "Viscous Flow", "Hydraulic Turbines"] }],
    },
    {
      branchCode: "ME",
      semesterNumber: 4,
      code: "ME401",
      name: "Kinematics & Dynamics of Machines",
      credits: 4,
      description: "Mechanisms, degree of freedom, velocity and acceleration analysis, cams, gears, and governors.",
      modules: [{ moduleNumber: 1, title: "Mechanisms & Gear Trains", description: "Four-bar linkages, epicyclic gear trains, balancing of masses.", topics: ["Four-Bar Chain", "Gear Trains", "Balancing"] }],
    },
  ];

  for (const s of subjectDefinitions) {
    const branchDoc = branchMap[s.branchCode];
    const deptId = `dept-${s.branchCode.toLowerCase()}`;
    const subjectId = `sub-${s.branchCode.toLowerCase()}-${s.code.toLowerCase()}`;

    await SubjectModel.findOneAndUpdate(
      { id: subjectId },
      {
        $set: {
          id: subjectId,
          code: s.code,
          name: s.name,
          departmentId: deptId,
          branchId: branchDoc ? branchDoc._id : undefined,
          branchCode: s.branchCode,
          semesterNumber: s.semesterNumber,
          credits: s.credits,
          description: s.description,
          modulesCount: s.modules.length,
          modules: s.modules.map((m) => ({
            id: `mod-${s.code.toLowerCase()}-${m.moduleNumber}`,
            moduleNumber: m.moduleNumber,
            title: m.title,
            description: m.description,
            topics: m.topics,
          })),
          isActive: true,
          syllabusUpdatedAt: new Date(),
          syllabusUpdatedBy: "Super Admin",
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Subject: [${s.branchCode} Sem ${s.semesterNumber}] ${s.code} - ${s.name}`);
  }
  console.log();

  // 3. SEED TEST USERS (ADMIN, FACULTY, STUDENTS ACROSS BRANCHES & SEMESTERS)
  console.log("Step 3: Seeding Institutional User Accounts...");
  const salt = await bcrypt.genSalt(10);
  const adminPassHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "AdminPass123!", salt);
  const facultyPassHash = await bcrypt.hash(process.env.FACULTY_PASSWORD || "FacultyPass123!", salt);
  const studentPassHash = await bcrypt.hash(process.env.STUDENT_PASSWORD || "StudentPass123!", salt);

  const cseBranch = branchMap["CSE"];
  const eceBranch = branchMap["ECE"];

  const userSeedData = [
    {
      name: "Dr. Arvind Mehra (Super Admin)",
      email: (process.env.ADMIN_EMAIL || "admin@campus.edu").toLowerCase(),
      passwordHash: adminPassHash,
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
      department: "Administration",
      rollNumber: "ADM-001",
    },
    {
      name: "Dr. Rahul Sharma",
      email: "sharma.faculty@campus.edu",
      passwordHash: facultyPassHash,
      role: "FACULTY" as const,
      status: "ACTIVE" as const,
      department: "CSE",
      branchId: cseBranch?._id,
      branchIds: [cseBranch?._id],
      facultyProfile: {
        designation: "Professor & Academic Head",
        title: "Senior Professor",
        officeLocation: "Turing Block, CS-402",
        bio: "Specializes in relational database query optimization and distributed data architectures.",
      },
    },
    {
      name: "Dr. Amit Kumar",
      email: "kumar.faculty@campus.edu",
      passwordHash: facultyPassHash,
      role: "FACULTY" as const,
      status: "ACTIVE" as const,
      department: "ECE",
      branchId: eceBranch?._id,
      branchIds: [eceBranch?._id, cseBranch?._id],
      facultyProfile: {
        designation: "Associate Professor",
        title: "Associate Professor",
        officeLocation: "Shannon Hall, EC-208",
        bio: "Specializes in digital signal processing, analog communications, and embedded microcontrollers.",
      },
    },
    {
      name: "Aditya Kumar",
      email: "aditya.student@campus.edu",
      passwordHash: studentPassHash,
      role: "STUDENT" as const,
      status: "ACTIVE" as const,
      department: "CSE",
      branchId: cseBranch?._id,
      semester: 3,
      rollNumber: "CS22B1045",
    },
    {
      name: "Ananya Sharma",
      email: "ananya.cse4@campus.edu",
      passwordHash: studentPassHash,
      role: "STUDENT" as const,
      status: "ACTIVE" as const,
      department: "CSE",
      branchId: cseBranch?._id,
      semester: 4,
      rollNumber: "CS21B1018",
    },
    {
      name: "Rohit Verma",
      email: "rohit.ece3@campus.edu",
      passwordHash: studentPassHash,
      role: "STUDENT" as const,
      status: "ACTIVE" as const,
      department: "ECE",
      branchId: eceBranch?._id,
      semester: 3,
      rollNumber: "EC22B2031",
    },
  ];

  const userMap: Record<string, any> = {};
  for (const u of userSeedData) {
    const userDoc = await UserModel.findOneAndUpdate(
      { email: u.email },
      { $set: u },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    userMap[u.email] = userDoc;
    console.log(`  ✓ User: ${u.name} (${u.role}) -> ${u.email} [Dept: ${u.department}, Sem: ${u.semester || "N/A"}]`);
  }
  console.log();

  // 4. SEED FACULTY-SUBJECT ASSIGNMENT (SUPER ADMIN -> FACULTY -> SUBJECT)
  console.log("Step 4: Seeding Faculty-Subject Academic Allocations...");
  const facultySharma = userMap["sharma.faculty@campus.edu"];
  const dbmsSubject = await SubjectModel.findOne({ code: "CS301", departmentId: "dept-cse", semesterNumber: 3 });
  const seSubject = await SubjectModel.findOne({ code: "CS401", departmentId: "dept-cse", semesterNumber: 4 });

  if (facultySharma && dbmsSubject) {
    const fsubDoc1 = await FacultySubject.findOneAndUpdate(
      {
        facultyId: facultySharma._id.toString(),
        subjectId: dbmsSubject.id,
        departmentId: "dept-cse",
        semesterNumber: 3,
        status: "ACTIVE",
      },
      {
        $set: {
          id: `fsub-sharma-cs301`,
          facultyId: facultySharma._id.toString(),
          facultyName: facultySharma.name,
          facultyEmail: facultySharma.email,
          subjectId: dbmsSubject.id,
          subjectCode: dbmsSubject.code,
          subjectName: dbmsSubject.name,
          departmentId: "dept-cse",
          branchId: cseBranch?._id,
          branchCode: "CSE",
          semesterNumber: 3,
          status: "ACTIVE",
          assignedBy: "Super Admin",
          assignedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Allocated: Dr. Rahul Sharma -> [CSE Sem 3] CS301 (DBMS)`);
  }

  if (facultySharma && seSubject) {
    await FacultySubject.findOneAndUpdate(
      {
        facultyId: facultySharma._id.toString(),
        subjectId: seSubject.id,
        departmentId: "dept-cse",
        semesterNumber: 4,
        status: "ACTIVE",
      },
      {
        $set: {
          id: `fsub-sharma-cs401`,
          facultyId: facultySharma._id.toString(),
          facultyName: facultySharma.name,
          facultyEmail: facultySharma.email,
          subjectId: seSubject.id,
          subjectCode: seSubject.code,
          subjectName: seSubject.name,
          departmentId: "dept-cse",
          branchId: cseBranch?._id,
          branchCode: "CSE",
          semesterNumber: 4,
          status: "ACTIVE",
          assignedBy: "Super Admin",
          assignedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Allocated: Dr. Rahul Sharma -> [CSE Sem 4] CS401 (Software Engineering)`);
  }

  const facultyKumar = userMap["kumar.faculty@campus.edu"];
  const analogCommSubject = await SubjectModel.findOne({ code: "EC301", departmentId: "dept-ece", semesterNumber: 3 });
  if (facultyKumar && analogCommSubject) {
    await FacultySubject.findOneAndUpdate(
      {
        facultyId: facultyKumar._id.toString(),
        subjectId: analogCommSubject.id,
        departmentId: "dept-ece",
        semesterNumber: 3,
        status: "ACTIVE",
      },
      {
        $set: {
          id: `fsub-kumar-ec301`,
          facultyId: facultyKumar._id.toString(),
          facultyName: facultyKumar.name,
          facultyEmail: facultyKumar.email,
          subjectId: analogCommSubject.id,
          subjectCode: analogCommSubject.code,
          subjectName: analogCommSubject.name,
          departmentId: "dept-ece",
          branchId: eceBranch?._id,
          branchCode: "ECE",
          semesterNumber: 3,
          status: "ACTIVE",
          assignedBy: "Super Admin",
          assignedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Allocated: Dr. Amit Kumar -> [ECE Sem 3] EC301 (Analog Communication)`);
  }
  console.log();

  // 5. SEED INITIAL ASSIGNMENT FOR CSE SEM 3 DBMS (FACULTY -> ASSIGNMENT)
  console.log("Step 5: Seeding Academic Scoped Coursework Assignment...");
  const sampleAssignmentId = "assign-cse3-dbms-lab1";
  const deadlineDate = new Date(Date.now() + 5 * 86400000);

  const sampleAssignment = await Assignment.findOneAndUpdate(
    { id: sampleAssignmentId },
    {
      $set: {
        id: sampleAssignmentId,
        title: "Lab 1: Relational Schema Normalization & Complex SQL Queries",
        description: "Design an optimal normalized relational database schema (up to BCNF) for a university library management system. Write SQL queries with recursive joins and aggregations.",
        subjectId: dbmsSubject?.id || "sub-cs301",
        subjectCode: "CS301",
        subjectName: "Database Management Systems",
        moduleId: "mod-cs301-2",
        moduleTitle: "Normalization & Schema Design",
        departmentId: "dept-cse",
        semesterNumber: 3,
        facultyId: facultySharma._id.toString(),
        facultyName: facultySharma.name,
        totalMarks: 30,
        deadline: deadlineDate,
        allowLate: false,
        assignmentType: "code",
        instructions: [
          "1. Submit clean, runnable SQL DDL and DML scripts.",
          "2. Ensure all functional dependencies satisfy Boyce-Codd Normal Form.",
          "3. Include sample query output and performance benchmarks.",
        ],
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`  ✓ Assignment: "${sampleAssignment.title}" for CSE Sem 3 (Faculty: ${sampleAssignment.facultyName})`);

  // 6. SEED SAMPLE SUBMISSION FOR ADITYA (STUDENT -> SUBMISSION)
  console.log("Step 6: Seeding Sample Student Submission...");
  const studentAditya = userMap["aditya.student@campus.edu"];
  if (studentAditya) {
    const submissionId = "subm-aditya-dbms-lab1";
    await AssignmentSubmission.findOneAndUpdate(
      { assignmentId: sampleAssignmentId, studentId: studentAditya._id.toString() },
      {
        $set: {
          id: submissionId,
          assignmentId: sampleAssignmentId,
          studentId: studentAditya._id.toString(),
          studentName: studentAditya.name,
          studentRoll: studentAditya.rollNumber || "CS22B1045",
          submittedAt: new Date(Date.now() - 3600000),
          content: "-- Library Management System DDL & DML Solution\nCREATE TABLE Books (\n  book_id VARCHAR(10) PRIMARY KEY,\n  title VARCHAR(100) NOT NULL,\n  isbn VARCHAR(20) UNIQUE\n);\n",
          submissionType: "code",
          fileName: "Aditya_DBMS_Lab1.sql",
          fileSize: "12 KB",
          maxMarks: 30,
          status: "submitted",
          files: [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Submission: ${studentAditya.name} submitted for Lab 1 (Status: submitted)`);
  }

  console.log("\n===============================================================");
  console.log("   ACADEMIC SEEDING COMPLETE: ALL HIERARCHIES SYNCHRONIZED     ");
  console.log("===============================================================\n");
}

seedAcademic()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
