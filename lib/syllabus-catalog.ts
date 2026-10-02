import SubjectModel, { ISubject } from "@/models/Subject";
import connectToDatabase from "@/lib/db";
import { store } from "@/lib/store";

export interface SyllabusSubjectDefinition {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  semesterNumber: number;
  credits: number;
  description: string;
  modules: Array<{
    id?: string;
    moduleNumber: number;
    title: string;
    description: string;
    topics: string[];
  }>;
}

export const CANONICAL_SYLLABUS_SUBJECTS: SyllabusSubjectDefinition[] = [
  // CSE - Semester 3
  {
    id: "sub-cs301",
    code: "CS301",
    name: "Data Structures & Algorithms",
    departmentId: "dept-cse",
    semesterNumber: 3,
    credits: 4,
    description: "Linear and non-linear data structures, complexity analysis, and algorithmic design techniques.",
    modules: [
      {
        moduleNumber: 1,
        title: "Arrays, Linked Lists & Dynamic Memory",
        description: "Contiguous vs dynamic storage, single and doubly linked lists, circular buffers.",
        topics: ["Memory layout", "Singly & Doubly Linked Lists", "Time & Space Complexity"],
      },
      {
        moduleNumber: 2,
        title: "Stacks, Queues & Recursion",
        description: "LIFO and FIFO data structures, arithmetic expressions, call stacks.",
        topics: ["Infix to Postfix", "Priority Queues", "Deque data structure"],
      },
      {
        moduleNumber: 3,
        title: "Trees & Binary Search Trees",
        description: "Hierarchical structures, tree traversals, AVL rotations.",
        topics: ["BST insertion", "AVL rotations", "Trie trees"],
      },
      {
        moduleNumber: 4,
        title: "Graphs & Graph Algorithms",
        description: "Representations, topological sorting, shortest path trees.",
        topics: ["BFS & DFS", "Dijkstra Algorithm", "Kruskal & Prim MST"],
      },
    ],
  },
  {
    id: "sub-cs302",
    code: "CS302",
    name: "Object Oriented Programming (Java)",
    departmentId: "dept-cse",
    semesterNumber: 3,
    credits: 4,
    description: "OOP principles, JVM architecture, exception handling, multithreading, and Java Collections.",
    modules: [
      {
        moduleNumber: 1,
        title: "OOP Foundations & Java Architecture",
        description: "Bytecode compilation, JVM memory zones, encapsulation.",
        topics: ["Encapsulation", "JVM, JRE & JDK", "Constructors"],
      },
      {
        moduleNumber: 2,
        title: "Inheritance & Polymorphism",
        description: "Method overriding, dynamic dispatch, interface contracts.",
        topics: ["Abstract Classes", "Interfaces", "Polymorphism"],
      },
    ],
  },
  {
    id: "sub-cs303",
    code: "CS303",
    name: "Computer Organization & Architecture",
    departmentId: "dept-cse",
    semesterNumber: 3,
    credits: 3,
    description: "Instruction set architectures, ALU design, pipelining, and cache hierarchies.",
    modules: [
      {
        moduleNumber: 1,
        title: "Processor & Instruction Set Design",
        description: "Register transfer logic, instruction cycles, addressing modes.",
        topics: ["RISC vs CISC", "Addressing Modes", "ALU Structure"],
      },
    ],
  },
  {
    id: "sub-cs304",
    code: "CS304",
    name: "Discrete Mathematical Structures",
    departmentId: "dept-cse",
    semesterNumber: 3,
    credits: 3,
    description: "Propositional logic, set theory, graph theory, and combinatorics.",
    modules: [
      {
        moduleNumber: 1,
        title: "Logic & Propositional Calculus",
        description: "Truth tables, predicates, quantifiers, logical equivalences.",
        topics: ["Propositions", "Predicates", "Mathematical Induction"],
      },
    ],
  },

  // CSE - Semester 5
  {
    id: "sub-cs501",
    code: "CS501",
    name: "Database Management System",
    departmentId: "dept-cse",
    semesterNumber: 5,
    credits: 4,
    description: "Relational models, ER diagrams, SQL, normalization (1NF to BCNF), transaction concurrency, and indexing.",
    modules: [
      {
        moduleNumber: 1,
        title: "Relational Data Model & ER Diagrams",
        description: "Entities, attributes, relationships, keys, mapping ER to relational schemas.",
        topics: ["Entity-Relationship Model", "Relational Algebra", "Tuple Relational Calculus"],
      },
      {
        moduleNumber: 2,
        title: "SQL & Relational Integrity Constraints",
        description: "DDL, DML, complex joins, subqueries, views, triggers, and assertions.",
        topics: ["Complex Joins", "Aggregations", "Triggers & Views"],
      },
      {
        moduleNumber: 3,
        title: "Functional Dependencies & Normalization",
        description: "Design theory, Armstrong's axioms, 1NF, 2NF, 3NF, BCNF, lossless join decomposition.",
        topics: ["Functional Dependencies", "1NF to 3NF", "BCNF Decomposition"],
      },
      {
        moduleNumber: 4,
        title: "Transaction Processing & Concurrency Control",
        description: "ACID properties, serializability, two-phase locking (2PL), deadlock prevention.",
        topics: ["ACID Properties", "Conflict Serializability", "2PL Protocol"],
      },
    ],
  },
  {
    id: "sub-cs502",
    code: "CS502",
    name: "Operating Systems",
    departmentId: "dept-cse",
    semesterNumber: 5,
    credits: 4,
    description: "Kernel architecture, process scheduling, synchronization, virtual memory, paging, and file system design.",
    modules: [
      {
        moduleNumber: 1,
        title: "Processes, Threads & CPU Scheduling",
        description: "Process states, context switching, scheduling algorithms (FCFS, SJF, Round Robin, Multilevel).",
        topics: ["Process Control Block (PCB)", "Multithreading", "CPU Scheduling"],
      },
      {
        moduleNumber: 2,
        title: "Process Synchronization & Deadlocks",
        description: "Critical section problem, semaphores, monitors, mutexes, Banker's algorithm.",
        topics: ["Semaphores & Mutexes", "Classic IPC Problems", "Deadlock Avoidance"],
      },
      {
        moduleNumber: 3,
        title: "Memory Management & Virtual Memory",
        description: "Paging, segmentation, page fault handling, page replacement policies (LRU, FIFO).",
        topics: ["Demand Paging", "Page Replacement (LRU/FIFO)", "Thrashing"],
      },
    ],
  },
  {
    id: "sub-cs503",
    code: "CS503",
    name: "Computer Networks",
    departmentId: "dept-cse",
    semesterNumber: 5,
    credits: 4,
    description: "OSI and TCP/IP stack, socket programming, routing algorithms, transport layer protocols, and network security.",
    modules: [
      {
        moduleNumber: 1,
        title: "Network Architectures & Physical Layer",
        description: "Layered models, packet switching vs circuit switching, transmission media.",
        topics: ["OSI & TCP/IP Reference Models", "Packet Switching", "Transmission Media"],
      },
      {
        moduleNumber: 2,
        title: "Data Link Layer & Medium Access Control",
        description: "Error detection (CRC), framing, flow control, CSMA/CD, Ethernet standards.",
        topics: ["Framing & Error Control", "CSMA/CD", "Sliding Window Protocols"],
      },
      {
        moduleNumber: 3,
        title: "Network Layer & Routing Protocols",
        description: "IPv4/IPv6 addressing, subnetting, distance vector and link state routing (OSPF, BGP).",
        topics: ["IP Addressing & CIDR", "Dijkstra Routing", "BGP & OSPF"],
      },
      {
        moduleNumber: 4,
        title: "Transport Layer & Application Protocols",
        description: "TCP connection management, congestion control, UDP, DNS, HTTP, and TLS.",
        topics: ["TCP 3-way Handshake", "TCP Congestion Control", "DNS & HTTP/HTTPS"],
      },
    ],
  },
  {
    id: "sub-cs504",
    code: "CS504",
    name: "Software Engineering",
    departmentId: "dept-cse",
    semesterNumber: 5,
    credits: 3,
    description: "SDLC methodologies, Agile, Scrum, requirements engineering, software architecture, testing, and CI/CD.",
    modules: [
      {
        moduleNumber: 1,
        title: "Software Process Models & Agile",
        description: "Waterfall, spiral, incremental, Agile manifesto, Scrum sprint cycles.",
        topics: ["Waterfall & Spiral", "Agile & Scrum", "User Stories"],
      },
      {
        moduleNumber: 2,
        title: "Design Principles & Testing",
        description: "SOLID principles, design patterns, unit testing, integration testing, CI/CD pipelines.",
        topics: ["SOLID Principles", "Unit & Integration Testing", "CI/CD"],
      },
    ],
  },

  // CSE - Semester 6
  {
    id: "sub-cs601",
    code: "CS601",
    name: "Compiler Design",
    departmentId: "dept-cse",
    semesterNumber: 6,
    credits: 4,
    description: "Lexical analysis, syntax analysis (LL/LR parsers), semantic analysis, intermediate representation, code optimization.",
    modules: [
      {
        moduleNumber: 1,
        title: "Lexical & Syntax Analysis",
        description: "Regular expressions, DFAs, context-free grammars, LL(1) and LR(1) parsing.",
        topics: ["Lexical Tokens & DFAs", "LL(1) Parsers", "LR/LALR Parsers"],
      },
    ],
  },
  {
    id: "sub-cs602",
    code: "CS602",
    name: "Cloud Computing",
    departmentId: "dept-cse",
    semesterNumber: 6,
    credits: 3,
    description: "Cloud virtualization, IaaS, PaaS, SaaS, container orchestration, Kubernetes, and distributed storage.",
    modules: [
      {
        moduleNumber: 1,
        title: "Cloud Models & Virtualization",
        description: "Hypervisors, containers, service models, public vs private clouds.",
        topics: ["IaaS/PaaS/SaaS", "Containers vs VMs", "Microservices"],
      },
    ],
  },

  // ECE - Semester 3
  {
    id: "sub-ec301",
    code: "EC301",
    name: "Digital Electronics",
    departmentId: "dept-ece",
    semesterNumber: 3,
    credits: 4,
    description: "Boolean algebra, combinational logic, Karnaugh maps, sequential circuits, flip-flops, counters.",
    modules: [
      {
        moduleNumber: 1,
        title: "Logic Gates & Combinational Circuits",
        description: "K-maps, multiplexers, decoders, full adders.",
        topics: ["Karnaugh Maps", "Multiplexers", "Arithmetic Logic Circuits"],
      },
    ],
  },

  // ECE - Semester 5
  {
    id: "sub-ec501",
    code: "EC501",
    name: "Microprocessors & Microcontrollers",
    departmentId: "dept-ece",
    semesterNumber: 5,
    credits: 4,
    description: "8086 architecture, assembly language programming, interrupts, 8051 microcontroller, peripheral interfacing.",
    modules: [
      {
        moduleNumber: 1,
        title: "8086 Processor Architecture & Assembly",
        description: "Register organization, memory segmentation, instruction sets.",
        topics: ["8086 Registers", "Addressing Modes", "Interrupt Vectors"],
      },
    ],
  },
];

/**
 * Ensures all canonical syllabus subjects exist in MongoDB.
 * Called automatically by subject and assignment routes to guarantee
 * syllabus consistency without requiring manual DB seeding.
 */
export async function ensureSyllabusSubjectsInDB(): Promise<void> {
  try {
    await connectToDatabase();
    for (const sub of CANONICAL_SYLLABUS_SUBJECTS) {
      await SubjectModel.updateOne(
        { id: sub.id },
        {
          $setOnInsert: {
            id: sub.id,
            departmentId: sub.departmentId,
            semesterNumber: sub.semesterNumber,
            code: sub.code,
            name: sub.name,
            facultyId: "",
            facultyName: "Assigned by Super Admin",
            credits: sub.credits,
            color: "from-blue-600 to-indigo-600",
            description: sub.description,
            modulesCount: sub.modules.length,
            modules: sub.modules.map((m) => ({
              id: `mod-${sub.code.toLowerCase()}-${m.moduleNumber}`,
              moduleNumber: m.moduleNumber,
              title: m.title,
              description: m.description,
              topics: m.topics,
            })),
            syllabusUpdatedAt: new Date(),
            syllabusUpdatedBy: "Curriculum Board",
          },
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error("Failed to seed canonical syllabus subjects in DB:", err);
  }
}
