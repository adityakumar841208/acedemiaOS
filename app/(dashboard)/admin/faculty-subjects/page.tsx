import React from "react";
import FacultyAllocations from "@/components/admin/FacultyAllocations/FacultyAllocations";

export const metadata = {
  title: "Faculty Allocations - acedemiaOS",
  description: "Assign faculty members to branch and semester specific subjects",
};

export default function AdminFacultySubjectsPage() {
  return <FacultyAllocations />;
}
