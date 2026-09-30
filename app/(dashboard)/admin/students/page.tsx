import React from "react";
import StudentManagement from "@/components/admin/StudentManagement/StudentManagement";

export const metadata = {
  title: "Student Management - acedemiaOS",
  description: "Browse students organized in academic hierarchy (Branch -> Semester -> Students)",
};

export default function AdminStudentsPage() {
  return <StudentManagement />;
}
