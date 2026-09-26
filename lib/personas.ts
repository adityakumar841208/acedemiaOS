import { UserPersona } from "@/types";

export const DEMO_PERSONAS: Record<string, UserPersona> = {
  student: {
    id: "user-student-01",
    name: "Aditya Kumar",
    email: "aditya.cs22@campus.edu",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rollNumber: "CS22B1045",
    department: "CSE",
    semester: 3,
    title: "Undergraduate Student (CSE - 3rd Sem)",
  },
  cr: {
    id: "user-cr-01",
    name: "Priya Patel",
    email: "priya.cr@campus.edu",
    role: "cr",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    rollNumber: "CS22B1012",
    department: "CSE",
    semester: 3,
    title: "Class Representative (CSE - 3rd Sem)",
  },
  faculty: {
    id: "user-faculty-01",
    name: "Prof. Rajesh Sharma",
    email: "r.sharma@campus.edu",
    role: "faculty",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    department: "CSE",
    title: "Associate Professor & DSA Lead",
  },
  admin: {
    id: "user-admin-01",
    name: "Dr. Arvind Mehra",
    email: "dean.academics@campus.edu",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    department: "Administration",
    title: "Dean of Academics & SuperAdmin",
  },
};

export const DEFAULT_ROLE = "student";

