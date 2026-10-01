"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useUserSession } from "@/context/UserContext";

type Summary = { id: string; code: string; name: string; presentClasses: number; totalClasses: number; percentage: number | null };
type Session = { date: string; subjectId: string; records: Array<{ studentId: string; status: "present" | "absent" }>; subject?: { code: string; name: string } };

export default function StudentAttendancePage() {
  const { isStudent, isCR } = useUserSession();
  const [summary, setSummary] = useState<Summary[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance?view=student-summary")
      .then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.error); return data; })
      .then((data) => { setSummary(data.summary || []); setSessions(data.sessions || []); })
      .catch((error) => toast.error(error.message || "Unable to load attendance."))
      .finally(() => setLoading(false));
  }, []);

  const selected = summary.find((subject) => subject.id === selectedSubject);
  const visibleSessions = useMemo(() => selected ? sessions.filter((session) => session.subjectId === selected.id) : sessions, [selected, sessions]);
  const overall = summary.reduce((result, subject) => ({ present: result.present + subject.presentClasses, total: result.total + subject.totalClasses }), { present: 0, total: 0 });
  const overallPercentage = overall.total ? Math.round((overall.present / overall.total) * 1000) / 10 : null;

  if (!isStudent && !isCR) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-800">Student access is required.</div>;

  return <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-200">
    <header className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Student portal</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">My attendance</h1><p className="mt-1 text-sm text-slate-500">A record of every class used to calculate your percentage.</p></div><Link href="/dashboard" className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 sm:flex"><ArrowLeft className="h-4 w-4" /> Dashboard</Link></header>
    <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm"><p className="text-xs text-slate-400">Overall attendance</p><p className="mt-2 text-4xl font-bold tabular-nums">{overallPercentage === null ? "N/A" : `${overallPercentage}%`}</p><p className="mt-2 text-xs text-slate-400">{overall.present} present of {overall.total} recorded classes</p></div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-xs font-semibold text-emerald-800">Present classes</p><p className="mt-2 text-3xl font-bold tabular-nums text-emerald-950">{overall.present}</p><p className="mt-2 text-xs text-emerald-700">Across all subjects</p></div><div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="text-xs font-semibold text-rose-800">Absent classes</p><p className="mt-2 text-3xl font-bold tabular-nums text-rose-950">{Math.max(0, overall.total - overall.present)}</p><p className="mt-2 text-xs text-rose-700">Review the detail below</p></div></section>
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Subject breakdown</h2><p className="mt-1 text-xs text-slate-500">Select a subject to filter its class history.</p></div><CalendarDays className="h-5 w-5 text-indigo-600" /></div><div className="mt-5 overflow-hidden rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Present</th><th className="px-4 py-3">Total</th><th className="px-4 py-3 text-right">Rate</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={4} className="px-4 py-10 text-center text-xs text-slate-500">Loading attendance…</td></tr> : summary.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-xs text-slate-500">No attendance has been recorded yet.</td></tr> : summary.map((subject) => <tr key={subject.id} className={`cursor-pointer hover:bg-slate-50 ${selectedSubject === subject.id ? "bg-indigo-50/60" : ""}`} onClick={() => setSelectedSubject(selectedSubject === subject.id ? "" : subject.id)}><td className="px-4 py-3"><span className="block font-semibold text-slate-900">{subject.name}</span><span className="text-xs text-slate-500">{subject.code}</span></td><td className="px-4 py-3 tabular-nums text-slate-700">{subject.presentClasses}</td><td className="px-4 py-3 tabular-nums text-slate-700">{subject.totalClasses}</td><td className={`px-4 py-3 text-right font-bold tabular-nums ${subject.percentage !== null && subject.percentage < 75 ? "text-rose-700" : "text-emerald-700"}`}>{subject.percentage === null ? "N/A" : `${subject.percentage}%`}</td></tr>)}</tbody></table></div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Class history</h2><p className="mt-1 text-xs text-slate-500">{selected ? selected.name : "All subjects"}</p></div><Clock3 className="h-5 w-5 text-slate-400" /></div><div className="mt-5 space-y-2">{visibleSessions.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">No class records yet.</p> : visibleSessions.map((session) => { const record = session.records[0]; return <div key={`${session.subjectId}-${session.date}`} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3"><div><p className="text-sm font-medium text-slate-800">{new Date(session.date).toLocaleDateString()}</p><p className="text-xs text-slate-500">{session.subject?.code || "Subject"}</p></div>{record?.status === "present" ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Present</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700"><XCircle className="h-4 w-4" /> Absent</span>}</div>; })}</div></div></section>
  </div>;
}
