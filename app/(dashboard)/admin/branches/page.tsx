import React from "react";
import BranchManagement from "@/components/admin/BranchManagement/BranchManagement";

export const metadata = {
  title: "Branch Management - acedemiaOS",
  description: "Manage academic departments and branches",
};

export default function AdminBranchesPage() {
  return <BranchManagement />;
}
