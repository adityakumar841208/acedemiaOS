import assert from "node:assert";

const BASE_URL = "http://localhost:3005";

async function runTests() {
  console.log("🚀 Starting LMS E2E Verification Tests on " + BASE_URL + "...\n");

  // Helper to extract cookie
  const getAuthCookie = (res: Response): string => {
    const getSetCookie = (res.headers as any).getSetCookie?.() || [];
    const setCookie = res.headers.get("set-cookie") || getSetCookie.join("; ");
    const match = (setCookie || getSetCookie.join("; ")).match(/lms_token=([^;]+)/);
    return match ? `lms_token=${match[1]}` : "";
  };

  // Test 1: Middleware redirects unauthenticated user from /admin to /login?from=%2Fadmin
  console.log("1. Testing route protection middleware for unauthenticated user...");
  const unauthRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
  assert.strictEqual(
    [307, 308, 302, 303].includes(unauthRes.status),
    true,
    `Expected redirect, got status ${unauthRes.status}`
  );
  const location = unauthRes.headers.get("location");
  assert.strictEqual(
    location?.includes("/login"),
    true,
    `Expected redirect to /login, got: ${location}`
  );
  console.log("   ✅ Middleware properly redirected unauthenticated request to login.\n");

  // Test 2: Login as Student
  console.log("2. Testing Student login (aditya.student@campus.edu)...");
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "aditya.student@campus.edu",
      password: "StudentPass123!",
    }),
  });
  assert.strictEqual(studentLoginRes.status, 200);
  const studentLoginData = await studentLoginRes.json();
  assert.strictEqual(studentLoginData.user.role, "STUDENT");
  assert.strictEqual(studentLoginData.redirectTo, "/dashboard");
  const studentCookie = getAuthCookie(studentLoginRes);
  assert.ok(studentCookie.includes("lms_token="), "lms_token cookie must be present");
  console.log("   ✅ Student login succeeded, server determined redirectTo: /dashboard.\n");

  // Test 3: Authenticated session endpoint (GET /api/auth/me)
  console.log("3. Testing /api/auth/me with Student session cookie...");
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: studentCookie },
  });
  assert.strictEqual(meRes.status, 200);
  const meData = await meRes.json();
  assert.strictEqual(meData.user.email, "aditya.student@campus.edu");
  assert.strictEqual(meData.user.role, "STUDENT");
  assert.strictEqual(meData.user.passwordHash, undefined, "passwordHash MUST NOT be returned");
  console.log("   ✅ /api/auth/me returned authenticated user safely without passwordHash.\n");

  // Test 4: RBAC Server-Side Protection - Student cannot create assignment
  console.log("4. Testing RBAC: Student attempting POST /api/assignments (Faculty/Admin only)...");
  const studentCreateAssignment = await fetch(`${BASE_URL}/api/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      title: "Malicious Assignment",
      subject: "Data Structures",
      department: "Computer Science",
      semester: 3,
      dueDate: new Date().toISOString(),
      totalMarks: 100,
      description: "Should fail",
    }),
  });
  assert.strictEqual(studentCreateAssignment.status, 403, "Student must receive 403 Forbidden");
  const forbiddenData = await studentCreateAssignment.json();
  console.log(`   ✅ Blocked with 403: "${forbiddenData.error}"\n`);

  // Test 5: RBAC Server-Side Protection - Student cannot post announcement
  console.log("5. Testing RBAC: Student attempting POST /api/announcements (CR/Faculty/Admin only)...");
  const studentPostAnnouncement = await fetch(`${BASE_URL}/api/announcements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      title: "Malicious Announcement",
      content: "Should fail",
      category: "GENERAL",
    }),
  });
  assert.strictEqual(studentPostAnnouncement.status, 403, "Student must receive 403 Forbidden");
  console.log("   ✅ Blocked with 403 Forbidden for student announcement.\n");

  // Test 6: Registration Security - Cannot register as ADMIN
  console.log("6. Testing Registration Security: Disallowing ADMIN role registration...");
  const adminRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Fake Admin",
      email: "fakeadmin@campus.edu",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "ADMIN",
      department: "Computer Science",
      semester: 3,
    }),
  });
  assert.strictEqual(adminRegRes.status, 403);
  const adminRegData = await adminRegRes.json();
  console.log(`   ✅ Blocked with 403: "${adminRegData.error}"\n`);

  // Test 7: Registration Security - FACULTY requires valid invite code
  console.log("7. Testing Registration Security: Invalid invite code for Faculty...");
  const badInviteRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dr. Bad Invite",
      email: "badfaculty@campus.edu",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "FACULTY",
      department: "Computer Science",
      inviteCode: "WRONG_CODE",
    }),
  });
  assert.strictEqual(badInviteRes.status, 403);
  const badInviteData = await badInviteRes.json();
  console.log(`   ✅ Blocked with 403: "${badInviteData.error}"\n`);

  // Test 8: Valid Registration for Student
  const testStudentEmail = `test.student.${Date.now()}@campus.edu`;
  console.log(`8. Testing valid Student registration (${testStudentEmail})...`);
  const validRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "New Student",
      email: testStudentEmail,
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "STUDENT",
      department: "Computer Science",
      semester: 4,
    }),
  });
  assert.strictEqual(validRegRes.status, 201);
  const validRegData = await validRegRes.json();
  assert.strictEqual(validRegData.user.role, "STUDENT");
  assert.strictEqual(validRegData.user.email, testStudentEmail);
  console.log("   ✅ Valid student registered successfully.\n");

  // Test 9: Faculty Login & Permissions
  console.log("9. Testing Faculty Login (sharma.faculty@campus.edu)...");
  const facultyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "sharma.faculty@campus.edu",
      password: "FacultyPass123!",
    }),
  });
  assert.strictEqual(facultyLoginRes.status, 200);
  const facultyLoginData = await facultyLoginRes.json();
  assert.strictEqual(facultyLoginData.user.role, "FACULTY");
  assert.strictEqual(facultyLoginData.redirectTo, "/faculty");
  const facultyCookie = getAuthCookie(facultyLoginRes);
  console.log("   ✅ Faculty login verified, redirectTo: /faculty.\n");

  // Test 10: CR Login & Redirect
  console.log("10. Testing CR Login (priya.cr@campus.edu)...");
  const crLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "priya.cr@campus.edu",
      password: "CrPass123!",
    }),
  });
  assert.strictEqual(crLoginRes.status, 200);
  const crLoginData = await crLoginRes.json();
  assert.strictEqual(crLoginData.user.role, "CR");
  assert.strictEqual(crLoginData.redirectTo, "/cr");
  console.log("   ✅ CR login verified, redirectTo: /cr.\n");

  // Test 11: Admin Login & Redirect
  console.log("11. Testing Admin Login (admin@campus.edu)...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@campus.edu",
      password: "AdminPass123!",
    }),
  });
  assert.strictEqual(adminLoginRes.status, 200);
  const adminLoginData = await adminLoginRes.json();
  assert.strictEqual(adminLoginData.user.role, "ADMIN");
  assert.strictEqual(adminLoginData.redirectTo, "/admin");
  console.log("   ✅ Admin login verified, redirectTo: /admin.\n");

  // Test 12: Profile Name Update & Role Immutability
  console.log("12. Testing Profile Update & Role Immutability...");
  const updateProfileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      name: "Aditya Verma Updated",
      role: "ADMIN", // Attacker trying to elevate role
    }),
  });
  assert.strictEqual(updateProfileRes.status, 200);
  const updateProfileData = await updateProfileRes.json();
  assert.strictEqual(updateProfileData.user.name, "Aditya Verma Updated");
  assert.strictEqual(updateProfileData.user.role, "STUDENT", "Role must NOT be changeable by client");
  console.log("   ✅ Profile name updated, malicious role elevation safely prevented.\n");

  // Test 13: Logout & Cookie Invalidation
  console.log("13. Testing Logout action (POST /api/auth/logout)...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert.strictEqual(logoutRes.status, 200);
  const getSetCookie = (logoutRes.headers as any).getSetCookie?.() || [];
  const logoutCookie = logoutRes.headers.get("set-cookie") || getSetCookie.join("; ");
  assert.ok(
    logoutCookie?.includes("Max-Age=0") || logoutCookie?.includes("expires="),
    "lms_token cookie must be cleared on logout"
  );
  console.log("   ✅ Logout successfully cleared session cookie.\n");

  console.log("🎉 ALL 13 VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀");
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
