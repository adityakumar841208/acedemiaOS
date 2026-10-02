import React from "react";
import SubjectManagement from "@/components/admin/SubjectManagement/SubjectManagement";

export const metadata = {
  title: "Subject Management - acedemiaOS",
  description: "Manage branch and semester academic subjects and curricula",
};

export default function AdminSubjectsPage() {
  return <SubjectManagement />;
}
