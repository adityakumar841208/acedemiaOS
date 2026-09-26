import {
  VaultDepartment,
  VaultSemester,
  VaultSubject,
  VaultModule,
  VaultResourceType,
  VaultResource,
  VaultCategory,
} from "@/types/vault";

export const VAULT_DEPARTMENTS: VaultDepartment[] = [
  {
    id: "dept-cse",
    code: "CSE",
    name: "Computer Science & Engineering",
    description: "Algorithms, Systems, Artificial Intelligence, Databases & Software Engineering",
    icon: "Laptop",
    totalSemesters: 8,
    totalSubjects: 36,
    totalResources: 184,
    accentColor: "indigo",
  },
  {
    id: "dept-ece",
    code: "ECE",
    name: "Electronics & Communication",
    description: "Signals, Semiconductor Physics, Embedded Systems, VLSI Design & Telecommunications",
    icon: "Cpu",
    totalSemesters: 8,
    totalSubjects: 34,
    totalResources: 142,
    accentColor: "sky",
  },
  {
    id: "dept-ee",
    code: "EE",
    name: "Electrical Engineering",
    description: "Power Systems, Control Theory, Electrical Machines & Renewable Energy Grid",
    icon: "Zap",
    totalSemesters: 8,
    totalSubjects: 32,
    totalResources: 118,
    accentColor: "amber",
  },
  {
    id: "dept-mech",
    code: "MECH",
    name: "Mechanical Engineering",
    description: "Thermodynamics, Robotics, Fluid Dynamics, Mechanics & CAD/CAM Modeling",
    icon: "Cog",
    totalSemesters: 8,
    totalSubjects: 32,
    totalResources: 125,
    accentColor: "emerald",
  },
];

export const VAULT_SEMESTERS: VaultSemester[] = [
  {
    id: "sem-cse-1",
    departmentId: "dept-cse",
    number: 1,
    label: "Semester 1",
    academicYear: "1st Year",
    subjectCount: 5,
    resourceCount: 22,
  },
  {
    id: "sem-cse-2",
    departmentId: "dept-cse",
    number: 2,
    label: "Semester 2",
    academicYear: "1st Year",
    subjectCount: 5,
    resourceCount: 25,
  },
  {
    id: "sem-cse-3",
    departmentId: "dept-cse",
    number: 3,
    label: "Semester 3",
    academicYear: "2nd Year",
    subjectCount: 5,
    resourceCount: 42,
  },
  {
    id: "sem-cse-4",
    departmentId: "dept-cse",
    number: 4,
    label: "Semester 4",
    academicYear: "2nd Year",
    subjectCount: 5,
    resourceCount: 38,
  },
  {
    id: "sem-cse-5",
    departmentId: "dept-cse",
    number: 5,
    label: "Semester 5",
    academicYear: "3rd Year",
    subjectCount: 5,
    resourceCount: 30,
  },
  {
    id: "sem-cse-6",
    departmentId: "dept-cse",
    number: 6,
    label: "Semester 6",
    academicYear: "3rd Year",
    subjectCount: 4,
    resourceCount: 24,
  },
  {
    id: "sem-cse-7",
    departmentId: "dept-cse",
    number: 7,
    label: "Semester 7",
    academicYear: "4th Year",
    subjectCount: 4,
    resourceCount: 20,
  },
  {
    id: "sem-cse-8",
    departmentId: "dept-cse",
    number: 8,
    label: "Semester 8",
    academicYear: "4th Year",
    subjectCount: 3,
    resourceCount: 16,
  },
  // Semesters for ECE
  {
    id: "sem-ece-3",
    departmentId: "dept-ece",
    number: 3,
    label: "Semester 3",
    academicYear: "2nd Year",
    subjectCount: 5,
    resourceCount: 34,
  },
  {
    id: "sem-ece-4",
    departmentId: "dept-ece",
    number: 4,
    label: "Semester 4",
    academicYear: "2nd Year",
    subjectCount: 5,
    resourceCount: 31,
  },
  // Semesters for EE
  {
    id: "sem-ee-3",
    departmentId: "dept-ee",
    number: 3,
    label: "Semester 3",
    academicYear: "2nd Year",
    subjectCount: 5,
    resourceCount: 28,
  },
  // Semesters for MECH
  {
    id: "sem-mech-3",
    departmentId: "dept-mech",
    number: 3,
    label: "Semester 3",
    academicYear: "2nd Year",
    subjectCount: 5,
    resourceCount: 29,
  },
];

export const VAULT_SUBJECTS: VaultSubject[] = [
  {
    id: "sub-cs301",
    departmentId: "dept-cse",
    semesterNumber: 3,
    code: "CS301",
    name: "Data Structures & Algorithms",
    facultyName: "Prof. Rajesh Sharma",
    credits: 4,
    modulesCount: 5,
    resourceCount: 28,
    gradient: "from-blue-600 to-indigo-600",
    description: "Core algorithms, asymptotic complexity, linear & non-linear data structures, trees, graphs, and dynamic programming.",
  },
  {
    id: "sub-cs302",
    departmentId: "dept-cse",
    semesterNumber: 3,
    code: "CS302",
    name: "Computer Organization & Architecture",
    facultyName: "Dr. Ananya Sen",
    credits: 4,
    modulesCount: 5,
    resourceCount: 18,
    gradient: "from-emerald-600 to-teal-600",
    description: "Digital logic, ALU design, instruction set architecture (MIPS/RISC-V), pipelining, and cache memory hierarchies.",
  },
  {
    id: "sub-cs303",
    departmentId: "dept-cse",
    semesterNumber: 3,
    code: "CS303",
    name: "Discrete Mathematics",
    facultyName: "Prof. Vikram Malhotra",
    credits: 3,
    modulesCount: 5,
    resourceCount: 14,
    gradient: "from-amber-600 to-orange-600",
    description: "Propositional logic, set theory, combinatorics, recurrence relations, and graph theory proofs.",
  },
  {
    id: "sub-cs304",
    departmentId: "dept-cse",
    semesterNumber: 3,
    code: "CS304",
    name: "Object Oriented Programming (Java)",
    facultyName: "Dr. Kavita Verma",
    credits: 3,
    modulesCount: 5,
    resourceCount: 16,
    gradient: "from-purple-600 to-pink-600",
    description: "Encapsulation, inheritance, polymorphism, Java memory model, multithreading, and collections framework.",
  },
  // Semester 4 CSE
  {
    id: "sub-cs401",
    departmentId: "dept-cse",
    semesterNumber: 4,
    code: "CS401",
    name: "Operating Systems",
    facultyName: "Dr. Harish Joshi",
    credits: 4,
    modulesCount: 5,
    resourceCount: 22,
    gradient: "from-cyan-600 to-blue-600",
    description: "Processes, threads, CPU scheduling, synchronization, deadlocks, virtual memory paging, and file systems.",
  },
  {
    id: "sub-cs402",
    departmentId: "dept-cse",
    semesterNumber: 4,
    code: "CS402",
    name: "Database Management Systems",
    facultyName: "Prof. Sunita Rao",
    credits: 4,
    modulesCount: 5,
    resourceCount: 20,
    gradient: "from-rose-600 to-red-600",
    description: "Relational model, SQL, normalization (1NF-BCNF), transaction ACID properties, concurrency control, and indexing.",
  },
  // ECE Subjects
  {
    id: "sub-ec301",
    departmentId: "dept-ece",
    semesterNumber: 3,
    code: "EC301",
    name: "Signals & Systems",
    facultyName: "Dr. P. Venkatesh",
    credits: 4,
    modulesCount: 5,
    resourceCount: 18,
    gradient: "from-sky-600 to-indigo-600",
    description: "Continuous and discrete-time signals, LTI systems, Fourier analysis, Laplace and Z-transforms.",
  },
];

export const VAULT_MODULES: VaultModule[] = [
  // CS301 DSA Modules
  {
    id: "mod-cs301-1",
    subjectId: "sub-cs301",
    moduleNumber: 1,
    title: "Arrays, Strings & Complexity Analysis",
    description: "Asymptotic notation (Big-O, Omega, Theta), recurrence solving, dynamic arrays, two-pointer techniques, and string manipulation algorithms.",
    topics: ["Big-O / Omega / Theta", "Master Theorem", "Prefix Sums", "Two Pointers", "Sliding Window"],
    resourceCount: 8,
  },
  {
    id: "mod-cs301-2",
    subjectId: "sub-cs301",
    moduleNumber: 2,
    title: "Linked Lists, Stacks & Queues",
    description: "Singly, doubly, and circular linked lists. Monotonic stack applications, queue implementations using arrays and linked nodes.",
    topics: ["Singly & Doubly Lists", "Fast & Slow Pointers", "Monotonic Stack", "Circular Buffer", "Deque"],
    resourceCount: 6,
  },
  {
    id: "mod-cs301-3",
    subjectId: "sub-cs301",
    moduleNumber: 3,
    title: "Trees, Binary Search Trees & AVL Trees",
    description: "Binary tree traversals, BST properties, balanced trees (AVL rotations, red-black foundations), and binary priority queues (heaps).",
    topics: ["Inorder/Pre/Post Traversals", "BST Invariants", "AVL Left/Right Rotations", "Min/Max Heaps", "HeapSort"],
    resourceCount: 7,
  },
  {
    id: "mod-cs301-4",
    subjectId: "sub-cs301",
    moduleNumber: 4,
    title: "Graphs & Shortest Path Algorithms",
    description: "Graph representations (Adjacency matrix vs list), BFS, DFS, cycle detection, topological sorting, Dijkstra, Bellman-Ford, and Kruskal.",
    topics: ["BFS & DFS", "Topological Sort", "Dijkstra's Algorithm", "Bellman-Ford", "Union-Find & Kruskal"],
    resourceCount: 5,
  },
  {
    id: "mod-cs301-5",
    subjectId: "sub-cs301",
    moduleNumber: 5,
    title: "Hashing, Tries & Dynamic Programming",
    description: "Hash collisions and resolution strategies, Trie data structures, memoization, tabulation, and standard DP paradigms.",
    topics: ["Hash Tables & Chaining", "Trie Prefix Trees", "0/1 Knapsack", "LCS & LIS", "Matrix Chain Multi."],
    resourceCount: 4,
  },
  // CS302 COA Modules
  {
    id: "mod-cs302-1",
    subjectId: "sub-cs302",
    moduleNumber: 1,
    title: "Basic Structure of Computers & Machine Instructions",
    description: "Functional units, bus structures, performance metrics, and memory locations & addresses.",
    topics: ["Von Neumann Architecture", "Bus Organization", "MIPS Registers", "Addressing Modes"],
    resourceCount: 5,
  },
  {
    id: "mod-cs302-2",
    subjectId: "sub-cs302",
    moduleNumber: 2,
    title: "Arithmetic Operations & ALU Design",
    description: "Addition and subtraction of signed numbers, Booth's multiplication algorithm, and IEEE 754 floating point standard.",
    topics: ["Carry Lookahead Adder", "Booth's Algorithm", "IEEE 754 Single/Double", "Restoring Division"],
    resourceCount: 4,
  },
];

export const VAULT_RESOURCE_TYPES: VaultResourceType[] = [
  // For Module 1 of CS301
  {
    id: "type-cs301-1-notes",
    moduleId: "mod-cs301-1",
    category: "NOTES",
    label: "Lecture Notes",
    icon: "FileText",
    description: "Handwritten and typed comprehensive notes covering theory and code examples.",
    fileCount: 3,
  },
  {
    id: "type-cs301-1-ppt",
    moduleId: "mod-cs301-1",
    category: "PPT",
    label: "Slide Decks & PPTs",
    icon: "Presentation",
    description: "Official faculty classroom presentation slides with diagrams and walkthroughs.",
    fileCount: 2,
  },
  {
    id: "type-cs301-1-pyq",
    moduleId: "mod-cs301-1",
    category: "PYQ",
    label: "PYQs & Solved Papers",
    icon: "HelpCircle",
    description: "Previous 5 years mid-term and end-term questions with step-by-step solutions.",
    fileCount: 2,
  },
  {
    id: "type-cs301-1-lab",
    moduleId: "mod-cs301-1",
    category: "LAB",
    label: "Lab Manuals & Code",
    icon: "Code",
    description: "Practical lab exercise problem statements, test cases, and reference C++ implementations.",
    fileCount: 1,
  },
  // For Module 2 of CS301
  {
    id: "type-cs301-2-notes",
    moduleId: "mod-cs301-2",
    category: "NOTES",
    label: "Lecture Notes",
    icon: "FileText",
    description: "Complete notes on Stack/Queue pointer manipulation and amortized analysis.",
    fileCount: 3,
  },
  {
    id: "type-cs301-2-ppt",
    moduleId: "mod-cs301-2",
    category: "PPT",
    label: "Slide Decks & PPTs",
    icon: "Presentation",
    description: "Faculty visual slides on linked memory allocations and stack frames.",
    fileCount: 2,
  },
  {
    id: "type-cs301-2-pyq",
    moduleId: "mod-cs301-2",
    category: "PYQ",
    label: "PYQs & Solved Papers",
    icon: "HelpCircle",
    description: "University past questions on parenthesis checking, infix-to-postfix, and queues.",
    fileCount: 1,
  },
  // For Module 3 of CS301
  {
    id: "type-cs301-3-notes",
    moduleId: "mod-cs301-3",
    category: "NOTES",
    label: "Lecture Notes",
    icon: "FileText",
    description: "AVL rotation rules, BST construction, and heapify mathematical derivations.",
    fileCount: 3,
  },
  {
    id: "type-cs301-3-ppt",
    moduleId: "mod-cs301-3",
    category: "PPT",
    label: "Slide Decks & PPTs",
    icon: "Presentation",
    description: "Animated slide decks illustrating tree traversals and balance restorations.",
    fileCount: 2,
  },
  {
    id: "type-cs301-3-pyq",
    moduleId: "mod-cs301-3",
    category: "PYQ",
    label: "PYQs & Solved Papers",
    icon: "HelpCircle",
    description: "Exam questions on tree heights, balancing cases, and heap implementations.",
    fileCount: 2,
  },
];

export const VAULT_RESOURCES: VaultResource[] = [
  // CS301 - Module 1 - NOTES
  {
    id: "res-dsa-m1-notes-01",
    title: "Module 1 - Complete Arrays & Asymptotic Complexity Notes.pdf",
    description: "Comprehensive handwritten notes by Prof. Rajesh Sharma covering Big-O, Master Theorem with proofs, and dynamic array reallocation.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-1",
    moduleNumber: 1,
    moduleTitle: "Arrays, Strings & Complexity Analysis",
    category: "NOTES",
    fileUrl: "/sample-docs/dsa_arrays_complexity.pdf",
    fileSize: "2.8 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "FACULTY",
    },
    createdAt: "2026-08-20T10:30:00Z",
    downloadCount: 342,
    isVerified: true,
    contentSnippet: `# Module 1: Asymptotic Notations & Array Foundations

## 1. Asymptotic Notations
In computational complexity analysis, asymptotic notation characterizes the execution time or space requirements of an algorithm as the input size $n$ approaches infinity:

- **Big-O Notation ($O$):** Asymptotic Upper Bound.
  $f(n) = O(g(n))$ if there exist positive constants $c$ and $n_0$ such that $0 \\le f(n) \\le c \\cdot g(n)$ for all $n \\ge n_0$.
- **Big-Omega Notation ($\\Omega$):** Asymptotic Lower Bound.
  $f(n) = \\Omega(g(n))$ if $0 \\le c \\cdot g(n) \\le f(n)$ for all $n \\ge n_0$.
- **Big-Theta Notation ($\\Theta$):** Asymptotic Tight Bound.
  $f(n) = \\Theta(g(n))$ if and only if $f(n) = O(g(n))$ and $f(n) = \\Omega(g(n))$.

## 2. Dynamic Array Amortized Complexity
When a dynamic array (like std::vector or ArrayList) runs out of capacity:
1. Allocates a new contiguous buffer of size $2 \\times C$.
2. Copies all $N$ elements into the new memory buffer.
3. Frees the old memory array.

The amortized cost of an append operation over $N$ pushes is:
$$\\text{Amortized Cost} = \\frac{\\sum_{i=1}^{N} c_i}{N} = \\frac{N + \\sum_{k=0}^{\\lfloor \\log_2 N \\rfloor} 2^k}{N} \\le \\frac{3N}{N} = O(1)$$
`,
  },
  {
    id: "res-dsa-m1-notes-02",
    title: "Master Theorem & Recurrence Relations Cheatsheet.pdf",
    description: "Detailed breakdown of the 3 standard cases of Master Theorem with edge cases and substitution examples.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-1",
    moduleNumber: 1,
    moduleTitle: "Arrays, Strings & Complexity Analysis",
    category: "NOTES",
    fileUrl: "/sample-docs/master_theorem.pdf",
    fileSize: "1.4 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-cr-01",
      name: "Priya Patel",
      role: "CR",
    },
    createdAt: "2026-08-25T14:15:00Z",
    downloadCount: 289,
    isVerified: true,
    contentSnippet: `# Master Theorem Reference Guide

For recurrence relations of the form:
$$T(n) = a \\cdot T\\left(\\frac{n}{b}\\right) + f(n)$$
where $a \\ge 1$, $b > 1$, and $f(n) = \\Theta(n^d)$:

### Case 1: $d < \\log_b a$
The work is dominated by the leaves of the recursion tree.
$$T(n) = \\Theta(n^{\\log_b a})$$

### Case 2: $d = \\log_b a$
The work is distributed evenly across all levels of the recursion tree.
$$T(n) = \\Theta(n^d \\log n)$$

### Case 3: $d > \\log_b a$
The work is dominated by the root operation $f(n)$.
$$T(n) = \\Theta(f(n))$$
`,
  },
  {
    id: "res-dsa-m1-notes-03",
    title: "Two-Pointer & Sliding Window Master Guide.pdf",
    description: "Optimal patterns for array subsegment problems, monotonic deques, and string anagram matching.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-1",
    moduleNumber: 1,
    moduleTitle: "Arrays, Strings & Complexity Analysis",
    category: "NOTES",
    fileUrl: "/sample-docs/two_pointer_sliding_window.pdf",
    fileSize: "1.9 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "FACULTY",
    },
    createdAt: "2026-08-28T09:00:00Z",
    downloadCount: 195,
    isVerified: true,
    contentSnippet: `# Two-Pointer and Sliding Window Patterns

### 1. Opposing Ends Two Pointers
Used primarily on sorted arrays (e.g. 2Sum, Container with Most Water).
- Left pointer starts at $0$, Right pointer starts at $N-1$.
- Shrink the search window based on monotonic condition.

### 2. Variable-Size Sliding Window
- Expand \`right\` pointer until invariant is satisfied.
- Contract \`left\` pointer while condition holds to find minimal valid range.
Time Complexity: $O(N)$ because both pointers advance at most $N$ times.
`,
  },

  // CS301 - Module 1 - PPT
  {
    id: "res-dsa-m1-ppt-01",
    title: "Lecture 01-03: Asymptotic Analysis & Big-O Visualized.pptx",
    description: "Faculty slide deck featuring graph visualizations of polynomial vs exponential growth curves.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-1",
    moduleNumber: 1,
    moduleTitle: "Arrays, Strings & Complexity Analysis",
    category: "PPT",
    fileUrl: "/sample-docs/lecture_01_asymptotic.pptx",
    fileSize: "4.2 MB",
    fileType: "pptx",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "FACULTY",
    },
    createdAt: "2026-08-18T11:00:00Z",
    downloadCount: 210,
    isVerified: true,
    contentSnippet: `# Lecture Presentation: Growth of Functions

Slide 1: Title & Course Objectives (CS301)
Slide 2: Why do we measure relative growth rather than CPU clock time?
Slide 3: Plotting $O(1) < O(\\log n) < O(n) < O(n \\log n) < O(n^2) < O(2^n)$
Slide 4: Demonstrating constant factor irrelevance as $n \\to \\infty$
Slide 5: Formal Definition of Big-O, Big-Omega, Big-Theta
Slide 6: Summary & Homework Problems
`,
  },
  {
    id: "res-dsa-m1-ppt-02",
    title: "Lecture 04-06: Array Memory Layout & Pointer Arithmetic.pptx",
    description: "Visual explanation of cache lines, row-major vs column-major matrix ordering, and stride effects.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-1",
    moduleNumber: 1,
    moduleTitle: "Arrays, Strings & Complexity Analysis",
    category: "PPT",
    fileUrl: "/sample-docs/lecture_04_arrays.pptx",
    fileSize: "5.1 MB",
    fileType: "pptx",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "FACULTY",
    },
    createdAt: "2026-08-22T16:00:00Z",
    downloadCount: 178,
    isVerified: true,
    contentSnippet: `# Memory Layout and Modern CPU Cache Locality

Slide 1: Contiguous memory addressing in C/C++
Slide 2: Calculating 2D array offset: $\\text{Index}(i, j) = \\text{Base} + (i \\cdot C + j) \\times \\text{sizeof}(T)$
Slide 3: Spatial Locality: Why Row-Major iteration is $10\\times$ faster than Column-Major in C++
Slide 4: CPU Cache lines (64 bytes) and cache miss penalties
`,
  },

  // CS301 - Module 1 - PYQ
  {
    id: "res-dsa-m1-pyq-01",
    title: "Mid-Term Exam 2024: Module 1 Questions with Model Answers.pdf",
    description: "Official university mid-term question paper with mark distribution and detailed solution keys.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-1",
    moduleNumber: 1,
    moduleTitle: "Arrays, Strings & Complexity Analysis",
    category: "PYQ",
    fileUrl: "/sample-docs/dsa_midterm_2024_solved.pdf",
    fileSize: "2.1 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-cr-01",
      name: "Priya Patel",
      role: "CR",
    },
    createdAt: "2026-09-02T13:45:00Z",
    downloadCount: 420,
    isVerified: true,
    contentSnippet: `# Mid-Term Examination 2024: CS301 DSA
**Total Marks: 50 | Time: 2 Hours**

### Question 1 (10 Marks)
Prove using formal limits that $3n^2 + 5n \\log n = \\Theta(n^2)$.
**Solution:**
$$\\lim_{n \\to \\infty} \\frac{3n^2 + 5n \\log n}{n^2} = \\lim_{n \\to \\infty} \\left(3 + \\frac{5 \\log n}{n}\\right) = 3 + 0 = 3$$
Since $0 < 3 < \\infty$, both upper and lower bounds hold with $c_1 = 3$ and $c_2 = 4$ for $n \\ge 16$.

### Question 2 (10 Marks)
Solve the recurrence $T(n) = 4T(n/2) + n^2$.
**Solution:**
Here $a=4, b=2, f(n)=n^2$. $\\log_b a = \\log_2 4 = 2$.
$n^{\\log_b a} = n^2 = \\Theta(f(n))$.
By Case 2 of Master Theorem: $T(n) = \\Theta(n^2 \\log n)$.
`,
  },
  {
    id: "res-dsa-m1-pyq-02",
    title: "End-Term Past 3 Years Solved Question Bank (Module 1).pdf",
    description: "Compiled collection of all questions asked in 2022, 2023, and 2024 end-term examinations for Module 1.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-1",
    moduleNumber: 1,
    moduleTitle: "Arrays, Strings & Complexity Analysis",
    category: "PYQ",
    fileUrl: "/sample-docs/dsa_endterm_pyq_bank.pdf",
    fileSize: "3.5 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "FACULTY",
    },
    createdAt: "2026-09-05T18:20:00Z",
    downloadCount: 310,
    isVerified: true,
    contentSnippet: `# End-Term Solved Bank: 2022 - 2024

Contains:
- 14 recurrence analysis questions with substitution and tree method verifications.
- 8 array partitioning and two-pointer proof questions.
- Common exam traps on worst-case vs amortized analysis.
`,
  },

  // CS301 - Module 1 - LAB
  {
    id: "res-dsa-m1-lab-01",
    title: "Lab Assignment 01: Dynamic Array Vector Implementation in C++.pdf",
    description: "Laboratory exercise sheet with template code, memory leak testing with valgrind, and automated test cases.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-1",
    moduleNumber: 1,
    moduleTitle: "Arrays, Strings & Complexity Analysis",
    category: "LAB",
    fileUrl: "/sample-docs/dsa_lab_01.pdf",
    fileSize: "1.1 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "FACULTY",
    },
    createdAt: "2026-08-24T08:00:00Z",
    downloadCount: 230,
    isVerified: true,
    contentSnippet: `# CS301 Lab Assignment 01: Custom Vector Class

### Problem Statement:
Implement a generic \`CustomVector<T>\` class in modern C++ with the following:
- \`push_back(const T& val)\` with automatic geometric capacity doubling ($2\\times$).
- \`pop_back()\` and \`shrink_to_fit()\`.
- Proper deep copy constructor and copy assignment operator.
- Iterator support for range-based for loops.
`,
  },

  // CS301 - Module 2 - NOTES
  {
    id: "res-dsa-m2-notes-01",
    title: "Module 2 - Stacks, Queues & Linked Lists Lecture Handbook.pdf",
    description: "Detailed guide to pointer manipulation, cycle detection with Floyd's algorithm, and monotonic stack patterns.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-2",
    moduleNumber: 2,
    moduleTitle: "Linked Lists, Stacks & Queues",
    category: "NOTES",
    fileUrl: "/sample-docs/dsa_m2_stacks_queues.pdf",
    fileSize: "3.1 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "FACULTY",
    },
    createdAt: "2026-09-01T10:00:00Z",
    downloadCount: 260,
    isVerified: true,
    contentSnippet: `# Module 2: Linear Data Structures

### Floyd's Cycle Detection Algorithm (Tortoise & Hare)
Let a linked list have a non-cyclic leader segment of length $k$ and a cycle of length $C$.
1. Slow pointer moves 1 step; Fast pointer moves 2 steps.
2. They collide inside the cycle.
3. Reset one pointer to head; advance both 1 step at a time. The point of second collision is the exact cycle entrance!
`,
  },

  // CS301 - Module 3 - NOTES
  {
    id: "res-dsa-m3-notes-01",
    title: "Module 3 - Trees, Binary Search Trees & AVL Rotations.pdf",
    description: "Complete mathematical derivations of AVL balance factors (LL, RR, LR, RL rotations) and red-black tree properties.",
    departmentId: "dept-cse",
    semesterNumber: 3,
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-3",
    moduleNumber: 3,
    moduleTitle: "Trees, Binary Search Trees & AVL Trees",
    category: "NOTES",
    fileUrl: "/sample-docs/dsa_m3_trees_avl.pdf",
    fileSize: "4.0 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "FACULTY",
    },
    createdAt: "2026-09-10T12:00:00Z",
    downloadCount: 380,
    isVerified: true,
    contentSnippet: `# Module 3: Hierarchical Data Structures & Balanced Trees

### AVL Tree Invariants
For every node $X$ in an AVL tree:
$$\\text{Balance Factor}(X) = \\text{Height}(\\text{LeftChild}) - \\text{Height}(\\text{RightChild}) \\in \\{-1, 0, 1\\}$$

When an insertion causes $|\\text{BF}| > 1$:
- **Case LL:** Single Right Rotation on root.
- **Case RR:** Single Left Rotation on root.
- **Case LR:** Left Rotation on left child, followed by Right Rotation on root.
- **Case RL:** Right Rotation on right child, followed by Left Rotation on root.
`,
  },
];

// Helper Functions
export function getVaultDepartments(): VaultDepartment[] {
  return VAULT_DEPARTMENTS;
}

export function getVaultDepartmentById(deptId: string): VaultDepartment | undefined {
  return VAULT_DEPARTMENTS.find((d) => d.id === deptId);
}

export function getVaultSemestersByDept(deptId: string): VaultSemester[] {
  return VAULT_SEMESTERS.filter((s) => s.departmentId === deptId);
}

export function getVaultSemesterById(semId: string): VaultSemester | undefined {
  return VAULT_SEMESTERS.find((s) => s.id === semId);
}

export function getVaultSubjects(deptId?: string, semesterNumber?: number): VaultSubject[] {
  return VAULT_SUBJECTS.filter((sub) => {
    if (deptId && sub.departmentId !== deptId) return false;
    if (semesterNumber && sub.semesterNumber !== semesterNumber) return false;
    return true;
  });
}

export function getVaultSubjectById(subjectId: string): VaultSubject | undefined {
  return VAULT_SUBJECTS.find((s) => s.id === subjectId);
}

export function getVaultModules(subjectId: string): VaultModule[] {
  return VAULT_MODULES.filter((m) => m.subjectId === subjectId);
}

export function getVaultModuleById(moduleId: string): VaultModule | undefined {
  return VAULT_MODULES.find((m) => m.id === moduleId);
}

export function getVaultResourceTypes(moduleId: string): VaultResourceType[] {
  const types = VAULT_RESOURCE_TYPES.filter((t) => t.moduleId === moduleId);
  if (types.length > 0) return types;

  // Fallback default set for modules without explicit custom types
  const defaultCategories: { cat: VaultCategory; label: string; icon: string; desc: string }[] = [
    { cat: "NOTES", label: "Lecture Notes", icon: "FileText", desc: "Handwritten and typed notes" },
    { cat: "PPT", label: "Slide Decks & PPTs", icon: "Presentation", desc: "Faculty presentation slides" },
    { cat: "PYQ", label: "PYQs & Solutions", icon: "HelpCircle", desc: "Past semester exam papers" },
    { cat: "LAB", label: "Lab Manuals & Code", icon: "Code", desc: "Practical problem sheets" },
  ];

  return defaultCategories.map((c) => ({
    id: `type-${moduleId}-${c.cat.toLowerCase()}`,
    moduleId,
    category: c.cat,
    label: c.label,
    icon: c.icon,
    description: c.desc,
    fileCount: 2,
  }));
}

export function getVaultResources(params?: {
  departmentId?: string;
  semesterNumber?: number;
  subjectId?: string;
  moduleId?: string;
  category?: VaultCategory;
  search?: string;
}): VaultResource[] {
  return VAULT_RESOURCES.filter((res) => {
    if (params?.departmentId && res.departmentId !== params.departmentId) return false;
    if (params?.semesterNumber && res.semesterNumber !== params.semesterNumber) return false;
    if (params?.subjectId && res.subjectId !== params.subjectId) return false;
    if (params?.moduleId && res.moduleId !== params.moduleId) return false;
    if (params?.category && res.category !== params.category) return false;
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase();
      const match =
        res.title.toLowerCase().includes(q) ||
        res.subjectName.toLowerCase().includes(q) ||
        res.subjectCode.toLowerCase().includes(q) ||
        res.moduleTitle.toLowerCase().includes(q) ||
        res.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

export type VaultResourceScope = {
  departmentId?: string;
  semesterNumber?: number;
  subjectId?: string;
  moduleId?: string;
  category?: VaultCategory;
};

export function hasVaultResources(scope: VaultResourceScope): boolean {
  return getVaultResources(scope).length > 0;
}

export function getVaultResourceById(resourceId: string): VaultResource | undefined {
  return VAULT_RESOURCES.find((r) => r.id === resourceId);
}

export function searchVaultEverywhere(query: string): {
  departments: VaultDepartment[];
  subjects: VaultSubject[];
  modules: VaultModule[];
  resources: VaultResource[];
} {
  const q = query.toLowerCase().trim();
  if (!q) {
    return { departments: [], subjects: [], modules: [], resources: [] };
  }

  return {
    departments: VAULT_DEPARTMENTS.filter(
      (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    ),
    subjects: VAULT_SUBJECTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    ),
    modules: VAULT_MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.topics.some((t) => t.toLowerCase().includes(q))
    ),
    resources: VAULT_RESOURCES.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.subjectName.toLowerCase().includes(q)
    ),
  };
}

