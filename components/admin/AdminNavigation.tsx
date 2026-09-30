"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Briefcase,
  GraduationCap,
  Building,
  Users,
} from "lucide-react";

interface AdminNavigationProps {
  counts?: {
    faculty?: number;
    students?: number;
    branches?: number;
    users?: number;
  };
}

export default function AdminNavigation({ counts }: AdminNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Overview",
      href: "/admin",
      icon: ShieldAlert,
      exact: true,
    },
    {
      name: "Faculty",
      href: "/admin/faculty",
      icon: Briefcase,
      count: counts?.faculty,
    },
    {
      name: "Students",
      href: "/admin/students",
      icon: GraduationCap,
      count: counts?.students,
    },
    {
      name: "Branches",
      href: "/admin/branches",
      icon: Building,
      count: counts?.branches,
    },
    {
      name: "All Users",
      href: "/admin/users",
      icon: Users,
      count: counts?.users,
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.name}</span>
            {item.count !== undefined && item.count !== null && (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
