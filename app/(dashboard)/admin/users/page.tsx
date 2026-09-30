import React from "react";
import UserManagement from "@/components/admin/UserManagement/UserManagement";

export const metadata = {
  title: "User Directory - acedemiaOS",
  description: "Manage all system user accounts and permissions",
};

export default function AdminUsersPage() {
  return <UserManagement />;
}
