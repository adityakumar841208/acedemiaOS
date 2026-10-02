"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Download, FileSpreadsheet, History, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { useUserSession } from "@/context/UserContext";

type Status = "present" | "absent";
type Subject = { id: string; code: string; name: string; semesterNumber: number; departmentId: string };
type Student = { id: string; name: string; rollNumber: string; department?: string; semester?: number };
type Session = { date: string; dayType?: "attendance" | "holiday"; holidayName?: string; records: Array<{ studentId: string; status: Status }> };
type CellMap = Record<string, Record<string, Status>>;
type ImportPreview = { entries: Array<{ date: string; type?: "holiday"; holidayName?: string; records?: Array<{ studentId: string; status: Status }> }>; errors: string[] };

const today = () => new Date().toISOString().slice(0, 10);
const monthRange = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
};
const dateLabel = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { day: "2-digit", weekday: "short" });

export default function FacultyAttendancePage() {
  const { isFaculty, isAdmin } = useUserSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cells, setCells] = useState<CellMap>({});
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [dirtyDates, setDirtyDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unlockedDates, setUnlockedDates] = useState<Set<string>>(new Set());

  const dates = useMemo(() => {
    const { from, to } = monthRange(month);
    const result: string[] = [];
    for (let cursor = new Date(`${from}T00:00:00Z`); cursor <= new Date(`${to}T00:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      result.push(cursor.toISOString().slice(0, 10));
    }
    return result;
  }, [month]);

  const selectedSubject = subjects.find((subject) => subject.id === subjectId);
  const registerRange = monthRange(month);
  const templateUrl = `/api/attendance/template?${new URLSearchParams({ subjectId, from: registerRange.from, to: registerRange.to }).toString()}`;

  const loadSubjects = async () => {
    const response = await fetch("/api/attendance?view=subjects");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load assigned subjects.");
    setSubjects(data.subjects || []);
    if (!subjectId && data.subjects?.[0]) setSubjectId(data.subjects[0].id);
  };

  const loadRegister = async () => {
    if (!subjectId) return;
    const { from, to } = monthRange(month);
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance?view=register&subjectId=${encodeURIComponent(subjectId)}&from=${from}&to=${to}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load attendance register.");
      const nextCells: CellMap = {};
      const nextHolidays: Record<string, string> = {};
      (data.sessions || []).forEach((session: Session) => {
        const date = session.date.slice(0, 10);
        if (session.dayType === "holiday") nextHolidays[date] = session.holidayName || "Holiday";
        else nextCells[date] = Object.fromEntries(session.records.map((record) => [record.studentId, record.status]));
      });
      setStudents(data.students || []);
      setSessions(data.sessions || []);
      setCells(nextCells);
      setHolidays(nextHolidays);
      setDirtyDates(new Set());
      setUnlockedDates(new Set());
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects().catch((error) => toast.error(error.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRegister();
  }, [subjectId, month]);

  const isDateLocked = (date: string) =>
    sessions.some((session) => session.date.slice(0, 10) === date) && !unlockedDates.has(date);

  const toggleDateLock = (date: string) => {
    setUnlockedDates((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const updateCell = (date: string, studentId: string) => {
    if (holidays[date] || date > today() || isDateLocked(date)) return;
    setCells((current) => ({ ...current, [date]: { ...current[date], [studentId]: current[date]?.[studentId] === "present" ? "absent" : "present" } }));
    setDirtyDates((current) => new Set(current).add(date));
  };

  const markDate = (date: string, status: Status) => {
    if (holidays[date] || date > today() || isDateLocked(date)) return;
    setCells((current) => ({ ...current, [date]: Object.fromEntries(students.map((student) => [student.id, status])) }));
    setDirtyDates((current) => new Set(current).add(date));
  };

  const toggleHoliday = (date: string) => {
    if (date > today() || isDateLocked(date)) return;
    if (holidays[date]) {
      setHolidays((current) => {
        const next = { ...current };
        delete next[date];
        return next;
      });
      setCells((current) => ({
        ...current,
        [date]: Object.fromEntries(students.map((student) => [student.id, "absent"])),
      }));
      setDirtyDates((current) => new Set(current).add(date));
      return;
    }
    const name = window.prompt("Holiday name", holidays[date] || "Holiday");
    if (!name) return;
    setHolidays((current) => ({ ...current, [date]: name }));
    setCells((current) => { const next = { ...current }; delete next[date]; return next; });
    setDirtyDates((current) => new Set(current).add(date));
  };

  const importRegister = async (file: File) => {
    if (!subjectId) {
      toast.error("Select an assigned subject first.");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("subjectId", subjectId);
      form.append("file", file);
      const previewResponse = await fetch("/api/attendance/import", { method: "POST", body: form });
      const previewData = await previewResponse.json();
      if (!previewResponse.ok) throw new Error(previewData.error || "Unable to read attendance register.");
      const preview = previewData.preview as ImportPreview;
      if (preview.errors.length) {
        throw new Error(`${preview.errors.length} import issue${preview.errors.length === 1 ? "" : "s"}: ${preview.errors[0]}`);
      }
      const saveResponse = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, entries: preview.entries }),
      });
      const saveData = await saveResponse.json();
      if (!saveResponse.ok) throw new Error(saveData.error || "Unable to save imported attendance.");
      toast.success(`${preview.entries.length} date${preview.entries.length === 1 ? "" : "s"} imported and locked.`);
      await loadRegister();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveChanges = async () => {
    if (!dirtyDates.size || !subjectId) return;
    setSaving(true);
    try {
      const entries = Array.from(dirtyDates).map((date) => holidays[date]
        ? { date, type: "holiday", holidayName: holidays[date] }
        : { date, records: students.map((student) => ({ studentId: student.id, status: cells[date]?.[student.id] || "absent" })) });
      const response = await fetch("/api/attendance", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, entries }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save attendance register.");
      toast.success(`${entries.length} date${entries.length === 1 ? "" : "s"} saved.`);
      await loadRegister();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const summary = (studentId: string) => {
    const workingDates = dates.filter((date) => !holidays[date] && date <= today() && sessions.some((session) => session.date.slice(0, 10) === date && session.dayType !== "holiday"));
    const present = workingDates.filter((date) => cells[date]?.[studentId] === "present").length;
    const absent = workingDates.filter((date) => cells[date]?.[studentId] === "absent").length;
    const total = present + absent;
    return { present, absent, total, percentage: total ? Math.round((present / total) * 1000) / 10 : 0 };
  };

  if (!isFaculty && !isAdmin) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-800">Faculty access is required.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Faculty workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Attendance Register</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">A date-column register for fast daily and monthly class marking.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/faculty/attendance/history" className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><History className="h-4 w-4" /> History</Link><a href={subjectId ? templateUrl : undefined} aria-disabled={!subjectId} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${subjectId ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50" : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"}`}><Download className="h-4 w-4" /> Template</a><label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${subjectId ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100" : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"}`}><FileSpreadsheet className="h-4 w-4" /> Import Register<input type="file" accept=".xlsx" className="sr-only" disabled={!subjectId || saving} onChange={(event) => { const file = event.target.files?.[0]; if (file) importRegister(file); event.currentTarget.value = ""; }} /></label></div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_220px_auto] md:items-end"><label className="text-xs font-semibold text-slate-700">Assigned subject<select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"><option value="">Select a subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} · {subject.name} · Sem {subject.semesterNumber}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Register month<input type="month" value={month} max={today().slice(0, 7)} onChange={(event) => setMonth(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-amber-500" /></label><button type="button" onClick={saveChanges} disabled={saving || !dirtyDates.size} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : `Save ${dirtyDates.size || ""} date${dirtyDates.size === 1 ? "" : "s"}`}</button></div>{selectedSubject && <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="font-semibold text-slate-900">{selectedSubject.code}</span><span>·</span><span>{selectedSubject.departmentId.replace(/^dept-/i, "").toUpperCase()}</span><span>·</span><span>Semester {selectedSubject.semesterNumber}</span><span className="ml-auto">P Present · A Absent · H Holiday</span></div>}</section>
 
  <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-max border-collapse text-xs"><thead><tr className="bg-slate-900 text-white"><th className="sticky left-0 z-30 w-20 border-r border-slate-700 bg-slate-900 px-3 py-3 text-left">Roll No.</th><th className="sticky left-20 z-30 w-56 border-r border-slate-700 bg-slate-900 px-3 py-3 text-left">Student Name</th>{dates.map((date) => <th key={date} className="w-20 border-r border-slate-700 px-2 py-2 text-center font-semibold"><span className="block">{dateLabel(date)}</span><div className="mt-2 flex justify-center gap-1"><button type="button" onClick={() => markDate(date, "present")} disabled={date > today() || Boolean(holidays[date]) || isDateLocked(date)} className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] hover:bg-emerald-500 disabled:opacity-40">P all</button><button type="button" onClick={() => markDate(date, "absent")} disabled={date > today() || Boolean(holidays[date]) || isDateLocked(date)} className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] hover:bg-rose-500 disabled:opacity-40">A all</button><button type="button" onClick={() => toggleHoliday(date)} disabled={date > today() || isDateLocked(date)} className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] hover:bg-amber-400 disabled:opacity-40">{holidays[date] ? "Clear H" : "H"}</button><button type="button" onClick={() => toggleDateLock(date)} className="rounded bg-slate-600 px-1.5 py-0.5 text-[10px] hover:bg-slate-500"><Lock className="inline h-3 w-3" /> {isDateLocked(date) ? "Unlock" : "Lock"}</button></div></th>)}<th className="sticky right-0 z-30 w-56 bg-slate-900 px-3 py-3 text-left">Summary</th></tr></thead><tbody className="divide-y divide-slate-200">{students.map((student, index) => { const stats = summary(student.id); return <tr key={student.id} className="hover:bg-amber-50/40"><td className="sticky left-0 z-20 border-r border-slate-200 bg-white px-3 py-3 font-mono font-semibold text-slate-700">{student.rollNumber || String(index + 1).padStart(2, "0")}</td><td className="sticky left-20 z-20 border-r border-slate-200 bg-white px-3 py-3 font-semibold text-slate-900">{student.name}</td>{dates.map((date) => { const value = holidays[date] ? "H" : cells[date]?.[student.id]; return <td key={date} className={`border-r border-slate-100 p-1 text-center ${date > today() ? "bg-slate-50" : ""}`}><button type="button" disabled={date > today() || Boolean(holidays[date]) || isDateLocked(date)} onClick={() => updateCell(date, student.id)} className={`flex h-9 w-full items-center justify-center rounded-md font-bold ${value === "present" ? "bg-emerald-100 text-emerald-700" : value === "absent" ? "bg-rose-100 text-rose-700" : value === "H" ? "bg-amber-100 text-amber-700" : "text-slate-300 hover:bg-slate-100"}`}>{value === "present" ? "P" : value === "absent" ? "A" : value || "-"}</button></td>; })}<td className="sticky right-0 z-20 border-l border-slate-200 bg-white px-3 py-2"><div className="grid grid-cols-4 gap-2 text-center"><span><b className="block text-emerald-700">{stats.present}</b><small className="text-[10px] text-slate-400">P</small></span><span><b className="block text-rose-700">{stats.absent}</b><small className="text-[10px] text-slate-400">A</small></span><span><b className="block text-slate-700">{stats.total}</b><small className="text-[10px] text-slate-400">Days</small></span><span><b className="block text-indigo-700">{stats.percentage}%</b><small className="text-[10px] text-slate-400">Rate</small></span></div></td></tr>; })}</tbody></table></div>{loading && <div className="border-t border-slate-200 p-4 text-center text-xs text-slate-500">Loading register...</div>}{!loading && !students.length && <div className="p-10 text-center text-sm text-slate-500">Select an assigned subject to load its class register.</div>}</section>
 
  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-600" /> Click a cell to toggle P/A</span><span><b className="text-emerald-700">P</b> Present</span><span><b className="text-rose-700">A</b> Absent</span><span><b className="text-amber-700">H</b> Holiday, excluded from working days</span></div>
    </div>
  );
}
