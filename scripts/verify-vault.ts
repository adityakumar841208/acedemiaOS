import assert from "node:assert";
import { buildVaultGraph } from "../lib/vault-layout";
import {
  getVaultDepartments,
  getVaultSemestersByDept,
  getVaultSubjects,
  getVaultModules,
  getVaultResources,
  getVaultResourceById,
} from "../lib/resource-vault-data";

const BASE_URL = "http://localhost:3006";

async function runVaultTests() {
  console.log("🚀 Running Resource Vault Verification Tests...\n");

  // -------------------------------------------------------------
  // Test 1: Layout Engine Progressive Disclosure
  // -------------------------------------------------------------
  console.log("1. Testing Progressive Graph Layout Engine...");

  const dummyCallbacks = {
    onSelectDepartment: () => {},
    onSelectSemester: () => {},
    onSelectSubject: () => {},
    onSelectModule: () => {},
    onSelectResourceType: () => {},
    onOpenResource: () => {},
  };

  // State 0: Initial State (No selections)
  const state0 = {
    selectedDepartmentId: null,
    selectedSemesterId: null,
    selectedSubjectId: null,
    selectedModuleId: null,
    selectedResourceTypeId: null,
    selectedCategory: "ALL" as const,
  };

  const graph0 = buildVaultGraph(state0, dummyCallbacks);
  assert.strictEqual(
    graph0.nodes.length,
    4,
    "Initial state must contain ONLY the 4 top-level department cards"
  );
  assert.strictEqual(
    graph0.edges.length,
    0,
    "Initial state must have 0 edges"
  );
  assert.ok(
    graph0.nodes.every((n) => n.type === "departmentNode"),
    "All initial nodes must be department nodes"
  );
  console.log("   ✅ Initial state strictly renders ONLY 4 Department cards.");

  // State 1: Department Clicked (CSE)
  const state1 = {
    ...state0,
    selectedDepartmentId: "dept-cse",
  };
  const graph1 = buildVaultGraph(state1, dummyCallbacks);
  assert.strictEqual(
    graph1.nodes.length,
    4 + 8,
    "Department selection must reveal its 8 semesters"
  );
  assert.strictEqual(
    graph1.edges.length,
    8,
    "Must create 8 animated edges from CSE to its semesters"
  );
  console.log("   ✅ Department click reveals 8 Semesters with 8 animated edges.");

  // State 2: Semester Clicked (Sem 3)
  const state2 = {
    ...state1,
    selectedSemesterId: "sem-cse-3",
  };
  const graph2 = buildVaultGraph(state2, dummyCallbacks);
  const subjectCount = getVaultSubjects("dept-cse", 3).length;
  assert.strictEqual(
    graph2.nodes.length,
    4 + 8 + subjectCount,
    `Semester 3 must reveal its ${subjectCount} subjects`
  );
  console.log(`   ✅ Semester click reveals ${subjectCount} Subjects.`);

  // State 3: Subject Clicked (Data Structures)
  const state3 = {
    ...state2,
    selectedSubjectId: "sub-cs301",
  };
  const graph3 = buildVaultGraph(state3, dummyCallbacks);
  const moduleCount = getVaultModules("sub-cs301").length;
  assert.strictEqual(
    graph3.nodes.length,
    4 + 8 + subjectCount + moduleCount,
    `DSA must reveal its ${moduleCount} modules`
  );
  console.log(`   ✅ Subject click reveals ${moduleCount} Modules.`);

  // State 4: Module Clicked (Module 1)
  const state4 = {
    ...state3,
    selectedModuleId: "mod-cs301-1",
  };
  const graph4 = buildVaultGraph(state4, dummyCallbacks);
  const resourceTypeNodes = graph4.nodes.filter(
    (n) => n.type === "resourceTypeNode"
  );
  assert.ok(
    resourceTypeNodes.length >= 3,
    "Module must reveal Resource Types (Notes, PPTs, PYQs)"
  );
  console.log(
    `   ✅ Module click reveals ${resourceTypeNodes.length} Resource Types.`
  );

  // State 5: Resource Type Clicked (Lecture Notes)
  const state5 = {
    ...state4,
    selectedResourceTypeId: "type-cs301-1-notes",
  };
  const graph5 = buildVaultGraph(state5, dummyCallbacks);
  const resourceNodes = graph5.nodes.filter((n) => n.type === "resourceNode");
  assert.ok(
    resourceNodes.length > 0,
    "Resource Type click must reveal concrete resource cards"
  );
  console.log(
    `   ✅ Resource Type click reveals ${resourceNodes.length} Concrete Resource Cards.\n`
  );

  // -------------------------------------------------------------
  // Test 2: Live Server Endpoint & Viewer Verification
  // -------------------------------------------------------------
  console.log("2. Testing Live Server Authentication & Vault Routes...");

  // Login as student
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "aditya.student@campus.edu",
      password: "StudentPass123!",
    }),
  });
  assert.strictEqual(loginRes.status, 200);
  const setCookie =
    loginRes.headers.get("set-cookie") ||
    ((loginRes.headers as any).getSetCookie?.() || []).join("; ");
  const tokenMatch = setCookie.match(/lms_token=([^;]+)/);
  assert.ok(tokenMatch, "Must receive lms_token");
  const authCookie = `lms_token=${tokenMatch[1]}`;
  console.log("   ✅ Authenticated with live session.");

  // Request /resources
  console.log("3. Fetching /resources vault page...");
  const vaultRes = await fetch(`${BASE_URL}/resources`, {
    headers: { Cookie: authCookie },
  });
  assert.strictEqual(vaultRes.status, 200);
  const vaultHtml = await vaultRes.text();
  assert.ok(
    vaultHtml.includes("Interactive Resource Vault"),
    "Must contain vault heading"
  );
  assert.ok(
    vaultHtml.includes("Progressive Knowledge Map"),
    "Must contain progressive knowledge map badge"
  );
  console.log("   ✅ /resources rendered with Interactive Knowledge Map.\n");

  // Request /resources/[id] viewer for Notes
  console.log("4. Fetching /resources/res-dsa-m1-notes-01 (Document Viewer)...");
  const viewerRes1 = await fetch(
    `${BASE_URL}/resources/res-dsa-m1-notes-01`,
    { headers: { Cookie: authCookie } }
  );
  assert.strictEqual(viewerRes1.status, 200);
  const viewerHtml1 = await viewerRes1.text();
  assert.ok(
    viewerHtml1.includes("Module 1 - Complete Arrays"),
    "Must display document title"
  );
  assert.ok(
    viewerHtml1.includes("Prof. Rajesh Sharma"),
    "Must display faculty uploader"
  );
  assert.ok(
    viewerHtml1.includes("Document Specifications"),
    "Must display document specifications"
  );
  console.log("   ✅ Document viewer rendered for DSA Module 1 Notes.\n");

  // Request /resources/[id] viewer for PYQ
  console.log("5. Fetching /resources/res-dsa-m1-pyq-01 (PYQ Viewer)...");
  const viewerRes2 = await fetch(`${BASE_URL}/resources/res-dsa-m1-pyq-01`, {
    headers: { Cookie: authCookie },
  });
  assert.strictEqual(viewerRes2.status, 200);
  const viewerHtml2 = await viewerRes2.text();
  assert.ok(
    viewerHtml2.includes("Mid-Term Exam 2024"),
    "Must display PYQ document title"
  );
  console.log("   ✅ Document viewer rendered for DSA Mid-Term PYQ.\n");

  // Request non-existent resource
  console.log("6. Fetching /resources/non-existent-id...");
  const viewerRes3 = await fetch(`${BASE_URL}/resources/non-existent-id`, {
    headers: { Cookie: authCookie },
  });
  assert.strictEqual(viewerRes3.status, 200);
  const viewerHtml3 = await viewerRes3.text();
  assert.ok(
    viewerHtml3.includes("Resource Not Found"),
    "Must display Resource Not Found state"
  );
  assert.ok(
    viewerHtml3.includes("Return to Resource Vault"),
    "Must provide link back to vault"
  );
  console.log("   ✅ Graceful 404/not-found fallback displayed with return action.\n");

  console.log("🎉 ALL RESOURCE VAULT VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀");
}

runVaultTests().catch((err) => {
  console.error("❌ Vault test failed:", err);
  process.exit(1);
});

