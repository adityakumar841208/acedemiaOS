import {
  Department,
  Semester,
  Subject,
  Module,
  Resource,
  Assignment,
  Submission,
  Announcement,
  NotificationItem,
} from "@/types";

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: "dept-cse",
    code: "CSE",
    name: "Computer Science & Engineering",
    description: "Algorithms, Systems, AI, and Software Engineering",
    icon: "Laptop",
    totalSemesters: 8,
  },
  {
    id: "dept-ece",
    code: "ECE",
    name: "Electronics & Communication",
    description: "Signals, VLSI, Embedded Systems, and IoT",
    icon: "Cpu",
    totalSemesters: 8,
  },
  {
    id: "dept-mech",
    code: "MECH",
    name: "Mechanical Engineering",
    description: "Thermodynamics, Robotics, Mechanics, and CAD",
    icon: "Cog",
    totalSemesters: 8,
  },
];

export const INITIAL_SEMESTERS: Semester[] = Array.from({ length: 8 }, (_, i) => ({
  id: `sem-${i + 1}`,
  departmentId: "dept-cse",
  number: i + 1,
  label: `${i + 1}${
    i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"
  } Semester`,
  academicYear: i < 2 ? "1st Year" : i < 4 ? "2nd Year" : i < 6 ? "3rd Year" : "4th Year",
}));

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: "sub-cs301",
    departmentId: "dept-cse",
    semesterNumber: 3,
    code: "CS301",
    name: "Data Structures & Algorithms",
    facultyId: "user-faculty-01",
    facultyName: "Prof. Rajesh Sharma",
    credits: 4,
    color: "from-blue-600 to-indigo-600",
    description: "Comprehensive exploration of linear and non-linear data structures, complexity analysis, and algorithmic design techniques.",
    modulesCount: 5,
  },
  {
    id: "sub-cs302",
    departmentId: "dept-cse",
    semesterNumber: 3,
    code: "CS302",
    name: "Object Oriented Programming (Java)",
    facultyId: "user-faculty-02",
    facultyName: "Dr. Sunita Rao",
    credits: 4,
    color: "from-amber-500 to-orange-600",
    description: "OOP principles, JVM architecture, exception handling, multithreading, and modern Java Collections Framework.",
    modulesCount: 4,
  },
  {
    id: "sub-cs303",
    departmentId: "dept-cse",
    semesterNumber: 3,
    code: "CS303",
    name: "Computer Organization & Architecture",
    facultyId: "user-faculty-03",
    facultyName: "Dr. Manoj Verma",
    credits: 3,
    color: "from-emerald-500 to-teal-600",
    description: "Instruction set architectures, ALU design, pipelining, cache memory hierarchies, and I/O organization.",
    modulesCount: 4,
  },
  {
    id: "sub-cs304",
    departmentId: "dept-cse",
    semesterNumber: 3,
    code: "CS304",
    name: "Discrete Mathematical Structures",
    facultyId: "user-faculty-04",
    facultyName: "Prof. Arvind Mathur",
    credits: 3,
    color: "from-purple-600 to-pink-600",
    description: "Propositional logic, set theory, graph theory, combinatorics, and algebraic structures for computing.",
    modulesCount: 4,
  },
];

export const INITIAL_MODULES: Module[] = [
  {
    id: "mod-cs301-1",
    subjectId: "sub-cs301",
    moduleNumber: 1,
    title: "Arrays, Linked Lists & Dynamic Memory",
    description: "Contiguous vs dynamic storage, single and doubly linked lists, circular buffers, and amortized array resizing.",
    topics: ["Memory layout of arrays", "Singly & Doubly Linked Lists", "Circular Linked Lists", "Skip Lists", "Time & Space Complexity"],
  },
  {
    id: "mod-cs301-2",
    subjectId: "sub-cs301",
    moduleNumber: 2,
    title: "Stacks, Queues & Recursion",
    description: "LIFO and FIFO data structures, stack evaluation of arithmetic expressions, circular queues, and call-stack unwinding.",
    topics: ["Infix to Postfix conversion", "Monotonic stacks", "Priority Queues", "Deque data structure"],
  },
  {
    id: "mod-cs301-3",
    subjectId: "sub-cs301",
    moduleNumber: 3,
    title: "Trees, Binary Search Trees & AVL",
    description: "Hierarchical structures, binary tree traversals, height-balanced AVL rotations, and Red-Black properties.",
    topics: ["BST insertion & deletion", "AVL Tree rotations (LL, RR, LR, RL)", "Tree traversal iterators", "Trie prefix trees"],
  },
  {
    id: "mod-cs301-4",
    subjectId: "sub-cs301",
    moduleNumber: 4,
    title: "Graphs & Graph Algorithms",
    description: "Graph representations, topological sorting, shortest path trees, and minimum spanning forest algorithms.",
    topics: ["Breadth-First Search (BFS)", "Depth-First Search (DFS)", "Dijkstra's Algorithm", "Kruskal & Prim MST", "Bellman-Ford"],
  },
  {
    id: "mod-cs301-5",
    subjectId: "sub-cs301",
    moduleNumber: 5,
    title: "Hashing & Advanced Sorting",
    description: "Hash functions, collision resolution mechanisms, quicksort, mergesort, and external memory sorting.",
    topics: ["Separate Chaining vs Open Addressing", "Universal Hashing", "Quicksort Lomuto vs Hoare", "Radix & Count Sort"],
  },
  {
    id: "mod-cs302-1",
    subjectId: "sub-cs302",
    moduleNumber: 1,
    title: "OOP Foundations & Java Architecture",
    description: "Bytecode compilation, JVM memory zones, encapsulation, constructors, and garbage collection mechanics.",
    topics: ["Encapsulation & Abstraction", "JVM, JRE & JDK", "Constructors & Memory", "Static vs Instance"],
  },
  {
    id: "mod-cs302-2",
    subjectId: "sub-cs302",
    moduleNumber: 2,
    title: "Inheritance, Interfaces & Polymorphism",
    description: "Method overriding, dynamic dispatch, interface contracts, default methods, and diamond problem resolution.",
    topics: ["Abstract Classes vs Interfaces", "Multiple inheritance via interfaces", "Covariant return types", "Polymorphism"],
  },
];

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: "res-01",
    title: "Complete Handwritten Notes: AVL Tree Rotations & Balance Factor",
    description: "Detailed step-by-step diagrammatic proofs of LL, RR, LR, and RL rotations with C++ and Java implementations.",
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-3",
    moduleNumber: 3,
    moduleTitle: "Trees, Binary Search Trees & AVL",
    departmentId: "dept-cse",
    semesterNumber: 3,
    category: "NOTES",
    fileUrl: "/docs/avl-tree-notes.pdf",
    fileSize: "3.4 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "faculty",
    },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    downloadCount: 142,
    isVerified: true,
    contentSnippet: `
# Module 3: AVL Tree Height Balancing Guide
**Department of Computer Science & Engineering | CS301**
**Instructor:** Prof. Rajesh Sharma

## 1. Definition of AVL Tree
An AVL Tree is a self-balancing Binary Search Tree (BST) where the difference between heights of left and right subtrees for any node cannot be more than 1.

$$\\text{Balance Factor } (BF) = \\text{Height}(\\text{Left Subtree}) - \\text{Height}(\\text{Right Subtree})$$
Acceptable values for $BF \\in \\{-1, 0, +1\\}$.

## 2. Four Rotations Cases
1. **Left-Left (LL) Rotation:** Single right rotation on unbalanced root.
2. **Right-Right (RR) Rotation:** Single left rotation on unbalanced root.
3. **Left-Right (LR) Rotation:** Left rotation on left child followed by Right rotation on root.
4. **Right-Left (RL) Rotation:** Right rotation on right child followed by Left rotation on root.

## 3. Algorithm: Single Right Rotation (LL Case)
\`\`\`cpp
Node* rotateRight(Node* y) {
    Node* x = y->left;
    Node* T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = max(height(y->left), height(y->right)) + 1;
    x->height = max(height(x->left), height(x->right)) + 1;
    return x;
}
\`\`\`
*Key Complexity:* All search, insertion, and deletion operations run in strictly **O(log N)** time.
    `,
  },
  {
    id: "res-02",
    title: "Mid-Term Past Year Questions (2021-2024) with Solved Model Answers",
    description: "Official question bank covering Modules 1, 2, and 3 with step-by-step marking rubrics and pseudo-code answers.",
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-2",
    moduleNumber: 2,
    moduleTitle: "Stacks, Queues & Recursion",
    departmentId: "dept-cse",
    semesterNumber: 3,
    category: "PYQ",
    fileUrl: "/docs/cs301-pyq-solved.pdf",
    fileSize: "4.8 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-cr-01",
      name: "Priya Patel",
      role: "cr",
    },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    downloadCount: 289,
    isVerified: true,
    contentSnippet: `
# CS301: Mid-Term Examination - Solved PYQ Compilation (2021 - 2024)
**Curated by Class Representatives | Department of CSE**

### Question 1 (7 Marks)
*Explain how to implement a Queue using two Stacks. Provide push and pop amortized time complexity.*

**Answer:**
Let Stack 1 be \`s1\` (input stack) and Stack 2 be \`s2\` (output stack).
- **Enqueue(x):** Push onto \`s1\`. Time: O(1).
- **Dequeue():**
  1. If \`s2\` is empty, pop every element from \`s1\` and push onto \`s2\`.
  2. Pop the top element from \`s2\`.
  3. If both stacks are empty, raise underflow error.
**Amortized Complexity:** Each element is pushed and popped at most twice. Amortized cost per operation = **O(1)**.

### Question 2 (8 Marks)
*Convert the following Infix Expression to Postfix using Shunting Yard:*
\`\`\`
A + B * (C ^ D - E) / (F + G * H)
\`\`\`
**Step-by-step Postfix Output:**
\`A B C D ^ E - * F G H * + / +\`
    `,
  },
  {
    id: "res-03",
    title: "Official Lecture Slide Deck: Dijkstra's Algorithm & Priority Queue Implementation",
    description: "Official presentation deck delivered in class. Includes trace diagrams and vertex relaxation walkthroughs.",
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-4",
    moduleNumber: 4,
    moduleTitle: "Graphs & Graph Algorithms",
    departmentId: "dept-cse",
    semesterNumber: 3,
    category: "PPT",
    fileUrl: "/docs/dijkstra-lecture.pptx",
    fileSize: "6.1 MB",
    fileType: "pptx",
    uploadedBy: {
      id: "user-faculty-01",
      name: "Prof. Rajesh Sharma",
      role: "faculty",
    },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    downloadCount: 97,
    isVerified: true,
    contentSnippet: `
# Lecture Slides: Single Source Shortest Path (Dijkstra)
**Slide 1: Problem Definition**
Given a directed or undirected graph G = (V, E) with non-negative edge weights w(u, v) >= 0 and source s.
Find the shortest path distance from s to all vertices v in V.

**Slide 2: Greedy Choice Property**
Greedy strategy: Maintain a set of visited vertices whose shortest distance is finalized. At each step, extract vertex u with minimum d[u] from PriorityQueue.

**Slide 3: Edge Relaxation Condition**
\`\`\`text
if (dist[v] > dist[u] + weight(u, v)) {
    dist[v] = dist[u] + weight(u, v);
    pq.insertOrDecreaseKey(v, dist[v]);
}
\`\`\`

**Slide 4: Time Complexity**
- Using Adjacency Matrix: O(V^2)
- Using Min-Heap (Binary Heap): O((V + E) log V)
- Using Fibonacci Heap: O(E + V log V)
    `,
  },
  {
    id: "res-04",
    title: "CS302 Java Multithreading & Synchronization Guide",
    description: "Threads lifecycle, synchronized blocks, wait/notify mechanisms, and thread pools using java.util.concurrent.",
    subjectId: "sub-cs302",
    subjectCode: "CS302",
    subjectName: "Object Oriented Programming (Java)",
    moduleId: "mod-cs302-2",
    moduleNumber: 2,
    moduleTitle: "Inheritance, Interfaces & Polymorphism",
    departmentId: "dept-cse",
    semesterNumber: 3,
    category: "NOTES",
    fileUrl: "/docs/java-threading.pdf",
    fileSize: "2.7 MB",
    fileType: "pdf",
    uploadedBy: {
      id: "user-faculty-02",
      name: "Dr. Sunita Rao",
      role: "faculty",
    },
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    downloadCount: 165,
    isVerified: true,
    contentSnippet: `
# CS302: Java Concurrency & Thread Synchronization
**Author:** Dr. Sunita Rao

## Thread Lifecycle States
1. **New:** Thread created but \`start()\` not yet invoked.
2. **Runnable:** Executing or ready in thread scheduler queue.
3. **Blocked:** Waiting to acquire an intrinsic monitor lock.
4. **Waiting:** Waiting indefinitely due to \`wait()\` or \`join()\`.
5. **Timed Waiting:** Sleeping or waiting with timeout (\`sleep(ms)\`).
6. **Terminated:** Execution completed.

## Preventing Race Conditions
\`\`\`java
public class BankAccount {
    private double balance;
    public synchronized void deposit(double amount) {
        if (amount > 0) balance += amount;
    }
}
\`\`\`
    `,
  },
];

// Seed assignments
const now = Date.now();
export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: "assign-01",
    title: "Lab Assignment 3: Self-Balancing AVL Tree Implementation",
    description: "Construct a generic AVL Tree class supporting insert, delete, and in-order traversal with automatic height balancing and rotation logging.",
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-3",
    moduleTitle: "Trees, Binary Search Trees & AVL",
    departmentId: "dept-cse",
    semesterNumber: 3,
    facultyId: "user-faculty-01",
    facultyName: "Prof. Rajesh Sharma",
    totalMarks: 25,
    deadline: new Date(now + 48 * 3600 * 1000).toISOString(), // 2 days from now (Active)
    allowLate: false,
    instructions: [
      "Implement single (LL, RR) and double (LR, RL) rotations.",
      "Print the tree balance factor after every batch insertion.",
      "Submit clean, well-commented C++ or Java code with main driver.",
      "Strict zero-tolerance policy for plagiarism. Submissions undergo automated similarity analysis.",
    ],
    createdAt: new Date(now - 2 * 86400000).toISOString(),
  },
  {
    id: "assign-02",
    title: "Lab Assignment 2: Graph Cycle Detection & Topological Sort",
    description: "Develop a DAG cycle detection algorithm using Kahn's BFS algorithm and DFS back-edge detection.",
    subjectId: "sub-cs301",
    subjectCode: "CS301",
    subjectName: "Data Structures & Algorithms",
    moduleId: "mod-cs301-4",
    moduleTitle: "Graphs & Graph Algorithms",
    departmentId: "dept-cse",
    semesterNumber: 3,
    facultyId: "user-faculty-01",
    facultyName: "Prof. Rajesh Sharma",
    totalMarks: 20,
    deadline: new Date(now - 12 * 3600 * 1000).toISOString(), // 12 hours ago (Expired / Locked)
    allowLate: false,
    instructions: [
      "Include time complexity comparison in your documentation.",
      "Provide edge case tests for disjoint graphs.",
      "Server deadline is strictly enforced. Late submissions are locked.",
    ],
    createdAt: new Date(now - 7 * 86400000).toISOString(),
  },
  {
    id: "assign-03",
    title: "Mini Project 1: Banking System with Thread Safety",
    description: "Create an object-oriented multi-account simulator using Java threads, reentrant locks, and atomic variables.",
    subjectId: "sub-cs302",
    subjectCode: "CS302",
    subjectName: "Object Oriented Programming (Java)",
    moduleId: "mod-cs302-2",
    moduleTitle: "Inheritance, Interfaces & Polymorphism",
    departmentId: "dept-cse",
    semesterNumber: 3,
    facultyId: "user-faculty-02",
    facultyName: "Dr. Sunita Rao",
    totalMarks: 30,
    deadline: new Date(now + 96 * 3600 * 1000).toISOString(), // 4 days from now
    allowLate: true,
    instructions: [
      "Design account classes adhering to SOLID principles.",
      "Simulate concurrent deposits and transfers between accounts.",
      "Handle deadlock conditions using ordered lock acquisition.",
    ],
    createdAt: new Date(now - 3 * 86400000).toISOString(),
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: "subm-01",
    assignmentId: "assign-01",
    studentId: "user-student-02",
    studentName: "Aman Verma",
    studentRoll: "CS22B1015",
    submittedAt: new Date(now - 20 * 3600 * 1000).toISOString(),
    content: `
// AVL Tree implementation by Aman Verma (CS22B1015)
#include <iostream>
#include <algorithm>
using namespace std;

struct Node {
    int key;
    Node *left;
    Node *right;
    int height;
    Node(int k) : key(k), left(nullptr), right(nullptr), height(1) {}
};

int getHeight(Node *n) { return n ? n->height : 0; }
int getBalance(Node *n) { return n ? getHeight(n->left) - getHeight(n->right) : 0; }

Node* rightRotate(Node *y) {
    Node *x = y->left;
    Node *T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
    x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
    return x;
}

Node* leftRotate(Node *x) {
    Node *y = x->right;
    Node *T2 = y->left;
    y->left = x;
    x->right = T2;
    x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
    y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
    return y;
}
    `,
    fileName: "Aman_AVLTree.cpp",
    fileSize: "2.1 KB",
    status: "submitted",
    maxMarks: 25,
  },
  {
    id: "subm-02",
    assignmentId: "assign-01",
    studentId: "user-student-03",
    studentName: "Rahul Gupta",
    studentRoll: "CS22B1028",
    submittedAt: new Date(now - 14 * 3600 * 1000).toISOString(),
    content: `
// AVL Tree implementation by Rahul Gupta (CS22B1028)
#include <iostream>
#include <algorithm>
using namespace std;

struct Node {
    int key;
    Node *left;
    Node *right;
    int height;
    Node(int k) : key(k), left(nullptr), right(nullptr), height(1) {}
};

int getHeight(Node *n) { return n ? n->height : 0; }
int getBalance(Node *n) { return n ? getHeight(n->left) - getHeight(n->right) : 0; }

Node* rightRotate(Node *y) {
    Node *x = y->left;
    Node *T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
    x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
    return x;
}

Node* leftRotate(Node *x) {
    Node *y = x->right;
    Node *T2 = y->left;
    y->left = x;
    x->right = T2;
    x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
    y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
    return y;
}
    `,
    fileName: "Rahul_AVLTree_Solution.cpp",
    fileSize: "2.1 KB",
    status: "submitted",
    maxMarks: 25,
    similarity: {
      score: 84,
      matchedWithSubmissionId: "subm-01",
      matchedWithStudentName: "Aman Verma",
      overlappingTokensCount: 68,
      matchedPhrases: [
        "x->right = y; y->left = T2; y->height = max(getHeight(y->left), getHeight(y->right)) + 1;",
        "Node(int k) : key(k), left(nullptr), right(nullptr), height(1)",
        "int getBalance(Node *n) { return n ? getHeight(n->left) - getHeight(n->right) : 0; }",
      ],
    },
  },
  {
    id: "subm-03",
    assignmentId: "assign-01",
    studentId: "user-student-04",
    studentName: "Neha Singh",
    studentRoll: "CS22B1032",
    submittedAt: new Date(now - 28 * 3600 * 1000).toISOString(),
    content: `
// Complete AVL Tree with generic templates
#include <iostream>
#include <memory>

template <typename T>
class AVLTree {
    struct Node {
        T data;
        std::shared_ptr<Node> left, right;
        int height;
        Node(T val) : data(val), left(nullptr), right(nullptr), height(1) {}
    };
    std::shared_ptr<Node> root;
    // custom rotation logic with smart pointers...
};
    `,
    fileName: "Neha_Generic_AVL.cpp",
    fileSize: "4.3 KB",
    status: "graded",
    marks: 24,
    maxMarks: 25,
    feedback: "Outstanding implementation! Clean usage of smart pointers and thorough rotation test suite.",
    gradedAt: new Date(now - 10 * 3600 * 1000).toISOString(),
    gradedBy: "Prof. Rajesh Sharma",
    similarity: {
      score: 12,
      matchedWithSubmissionId: "subm-01",
      matchedWithStudentName: "Aman Verma",
      overlappingTokensCount: 8,
      matchedPhrases: [],
    },
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-01",
    title: "🚨 Mid-Semester Lab Assessment Schedule Announced (CSE 3rd Sem)",
    content: "The Data Structures (CS301) Lab evaluation will be conducted on Friday, 10:00 AM in Lab Complex 2. Students must bring lab record files signed up to Module 3.",
    category: "EXAM",
    departmentId: "dept-cse",
    semesterNumber: 3,
    authorId: "user-faculty-01",
    authorName: "Prof. Rajesh Sharma",
    authorRole: "FACULTY",
    pinned: true,
    createdAt: new Date(now - 14 * 3600 * 1000).toISOString(),
  },
  {
    id: "ann-02",
    title: "📢 CR Notice: Solved PYQ Model Answers Uploaded to Resource Vault",
    content: "Hey CSE Batch! Solved 2021-2024 Mid-Term model answer keys have been uploaded to the CS301 Vault. Check Module 2 under PYQs. Good luck with prep!",
    category: "ACADEMIC",
    departmentId: "dept-cse",
    semesterNumber: 3,
    authorId: "user-cr-01",
    authorName: "Priya Patel",
    authorRole: "CR",
    pinned: false,
    createdAt: new Date(now - 22 * 3600 * 1000).toISOString(),
  },
  {
    id: "ann-03",
    title: "🎓 Academic Advisory: Zero-Tolerance Policy on Assignment Plagiarism",
    content: "All submitted assignments are automatically cross-checked via pairwise token similarity. Overlaps above 40% will receive an automatic zero and disciplinary review.",
    category: "URGENT",
    departmentId: "dept-cse",
    semesterNumber: "ALL",
    authorId: "user-admin-01",
    authorName: "Dr. Arvind Mehra",
    authorRole: "ADMIN",
    pinned: true,
    createdAt: new Date(now - 48 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-01",
    title: "New Assignment Posted: CS301 AVL Trees",
    message: "Prof. Rajesh Sharma published Lab Assignment 3. Deadline in 2 days.",
    type: "assignment",
    link: "/assignments/assign-01",
    isRead: false,
    createdAt: new Date(now - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-02",
    title: "Solved PYQ Available in Resource Vault",
    message: "CR Priya Patel shared Mid-Term Past Year Questions (2021-2024).",
    type: "resource",
    link: "/resources",
    isRead: false,
    createdAt: new Date(now - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-03",
    title: "Lab Assessment Schedule Published",
    message: "Data Structures lab evaluation on Friday at 10:00 AM.",
    type: "announcement",
    link: "/announcements",
    isRead: true,
    createdAt: new Date(now - 18 * 3600 * 1000).toISOString(),
  },
];


