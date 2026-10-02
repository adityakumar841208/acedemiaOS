"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Download, FileSpreadsheet, History, Search } from "lucide-react";
import { toast } from "sonner";

type Subject = { id: string; code: string; name: string; semesterNumber: number };
type Session = {
  _id: string;
  subjectId: string;
  date: string;
  dayType?: "attendance" | "holiday";
  holidayName?: string;
  records: Array<{ studentId: string; studentName: string; rollNumber: string; status: "present" | "absent" }>;
  subject?: { code: string; name: string };
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export default function FacultyAttendanceHistoryPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const loadSubjects = async () => {
    const response = await fetch("/api/attendance?view=subjects");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load assigned subjects.");
    setSubjects(data.subjects || []);
    if (!subjectId && data.subjects?.[0]) setSubjectId(data.subjects[0].id);
  };

  const searchHistory = async () => {
    if (!subjectId || !from || !to) {
      toast.error("Choose an assigned subject and date range.");
      return;
    }
    if (from > to) {
      toast.error("The start date must be before the end date.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: "history", subjectId, from, to });
      const response = await fetch(`/api/attendance?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load attendance history.");
      setSessions(data.sessions || []);
      setExpandedSessions(new Set());
      setSearched(true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects().catch((error) => toast.error(error.message)).finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const records = sessions.flatMap((session) => session.records);
    return {
      sessions: sessions.length,
      present: records.filter((record) => record.status === "present").length,
      absent: records.filter((record) => record.status === "absent").length,
    };
  }, [sessions]);

  const exportUrl = `/api/attendance/export?${new URLSearchParams({ subjectId, from, to }).toString()}`;
  const templateUrl = `/api/attendance/template?${new URLSearchParams({ subjectId, from, to }).toString()}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/faculty/attendance" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to attendance
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Faculty workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Attendance history</h1>
          <p className="mt-1 text-sm text-slate-500">Review attendance for subjects assigned to you and export a selected date range.</p>
        </div>
        <div className="flex flex-wrap gap-2"><a href={searched ? exportUrl : undefined} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${searched ? "bg-slate-900 text-white hover:bg-slate-800" : "cursor-not-allowed bg-slate-100 text-slate-400"}`} aria-disabled={!searched}><Download className="h-4 w-4" /> Download Excel</a><a href={subjectId ? templateUrl : undefined} className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${subjectId ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50" : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"}`} aria-disabled={!subjectId}><FileSpreadsheet className="h-4 w-4" /> Blank Template</a></div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto] md:items-end">
          <label className="text-xs font-semibold text-slate-700">Assigned subject
            <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" disabled={loading && subjects.length === 0}>
              <option value="">Select a subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} · {subject.name} · Sem {subject.semesterNumber}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">From<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
          <label className="text-xs font-semibold text-slate-700">To<input type="date" value={to} min={from} max={isoDate(new Date())} onChange={(event) => setTo(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
          <button type="button" onClick={searchHistory} disabled={loading || !subjectId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><Search className="h-4 w-4" /> Query</button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[{ label: "Class sessions", value: totals.sessions }, { label: "Present records", value: totals.present }, { label: "Absent records", value: totals.absent }].map((item) => <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p></div>)}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><History className="h-4 w-4 text-indigo-600" /><h2 className="text-sm font-bold text-slate-900">Queried sessions</h2></div>
        {sessions.length === 0 ? <div className="p-12 text-center text-sm text-slate-500"><FileSpreadsheet className="mx-auto mb-3 h-8 w-8 text-slate-300" />{searched ? "No attendance records found for this range." : "Choose a subject and date range to view history."}</div> : <div className="divide-y divide-slate-100">{sessions.map((session) => { const present = session.records.filter((record) => record.status === "present").length; const total = session.records.length; const isExpanded = expandedSessions.has(session._id); const presentRecords = session.records.filter((record) => record.status === "present"); const absentRecords = session.records.filter((record) => record.status === "absent"); return <div key={session._id}>
          <button type="button" onClick={() => setExpandedSessions((current) => { const next = new Set(current); if (next.has(session._id)) next.delete(session._id); else next.add(session._id); return next; })} aria-expanded={isExpanded} className="flex w-full flex-col gap-2 px-5 py-4 text-left hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} /><div><p className="text-sm font-semibold text-slate-900">{new Date(session.date).toLocaleDateString()} <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase text-slate-500">{session.dayType || "attendance"}</span></p>{session.holidayName && <p className="mt-1 text-xs text-amber-700">{session.holidayName}</p>}</div></div>
            <p className="pl-7 text-xs font-semibold text-slate-500 sm:pl-0">{session.dayType === "holiday" ? "No class records" : `${present} present · ${total - present} absent`}</p>
          </button>
          {isExpanded && session.dayType !== "holiday" && <div className="grid gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4 md:grid-cols-2">
            {[{ label: "Present", records: presentRecords, tone: "text-emerald-700" }, { label: "Absent", records: absentRecords, tone: "text-rose-700" }].map((group) => <div key={group.label}><h3 className={`text-xs font-bold uppercase tracking-wider ${group.tone}`}>{group.label} ({group.records.length})</h3><div className="mt-2 space-y-1.5">{group.records.length === 0 ? <p className="text-xs text-slate-400">None</p> : group.records.map((record) => <div key={record.studentId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><span className="font-medium text-slate-800">{record.studentName}</span><span className="font-mono text-slate-500">{record.rollNumber}</span></div>)}</div></div>)}
          </div>}
        </div>; })}</div>}
      </section>
    </div>
  );
}
