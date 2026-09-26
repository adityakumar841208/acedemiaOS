"use client";

import { useEffect, useState } from "react";
import { useUserSession } from "@/context/UserContext";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

type PendingStudent = {
  _id: string;
  name: string;
  email: string;
  department: string;
  semester?: number;
  rollNumber?: string;
};

export default function PendingStudentApprovals() {
  const { isAdmin, isFaculty, isCR } = useUserSession();
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin && !isFaculty && !isCR) {
      setLoading(false);
      return;
    }
    fetch("/api/auth/approvals")
      .then((response) => response.ok ? response.json() : { students: [] })
      .then((data) => setStudents(data.students || []))
      .finally(() => setLoading(false));
  }, [isAdmin, isFaculty, isCR]);

  const decide = async (studentId: string, action: "APPROVE" | "REJECT") => {
    const rejectionReason = action === "REJECT" ? window.prompt("Reason for rejection (optional):") || undefined : undefined;
    const response = await fetch("/api/auth/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, action, rejectionReason }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Unable to update student");
      return;
    }
    setStudents((current) => current.filter((student) => student._id !== studentId));
    toast.success(action === "APPROVE" ? "Student approved." : "Student rejected.");
  };

  if ((!isAdmin && !isFaculty && !isCR) || loading || students.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pending Student Approvals</h2>
          <p className="mt-1 text-xs text-slate-500">Review registrations within your authorized academic scope.</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{students.length} pending</span>
      </div>
      <div className="space-y-3">
        {students.map((student) => (
          <div key={student._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">{student.name}</p>
              <p className="text-xs text-slate-500">{student.email} · {student.rollNumber || "Portal Roll No. pending"}</p>
              <p className="mt-1 text-xs text-slate-500">{student.department} · Semester {student.semester || "-"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => decide(student._id, "APPROVE")} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" />Approve</button>
              <button onClick={() => decide(student._id, "REJECT")} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><X className="h-3.5 w-3.5" />Reject</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
