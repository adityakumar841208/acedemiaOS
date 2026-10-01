"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CheckCircle2, Download, FileSpreadsheet, History, RotateCcw, Save, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useUserSession } from "@/context/UserContext";

type Mode = "present" | "absent";
type Subject = { id: string; code: string; name: string; semesterNumber: number };
type Student = { id: string; name: string; rollNumber: string };
type Session = { _id: string; subjectId: string; date: string; records: Array<{ studentId: string; status: Mode }>; subject?: { code: string; name: string } };
type Preview = { date: string; studentsFound: number; present: number; absent: number; errors: string[]; records: Array<{ studentId: string; name: string; rollNumber: string; status: Mode }> };

const today = () => new Date().toISOString().slice(0, 10);

export default function FacultyAttendancePage() {
  const { isFaculty, isAdmin } = useUserSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(today);
  const [students, setStudents] = useState<Student[]>([]);
  const [existing, setExisting] = useState<Session | null>(null);
  const [mode, setMode] = useState<Mode>("present");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Session[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSubjects = async () => {
    const res = await fetch("/api/attendance?view=subjects");
    if (!res.ok) throw new Error("Unable to load your teaching subjects.");
    const data = await res.json();
    setSubjects(data.subjects || []);
    if (!subjectId && data.subjects?.[0]) setSubjectId(data.subjects[0].id);
  };

  const loadClass = async () => {
    if (!subjectId) return;
    const res = await fetch(`/api/attendance?view=students&subjectId=${subjectId}&date=${date}`);
    if (!res.ok) throw new Error((await res.json()).error || "Unable to load the class roster.");
    const data = await res.json();
    setStudents(data.students || []);
    setExisting(data.attendance || null);
    const target = mode;
    setSelected(new Set((data.attendance?.records || []).filter((record: any) => record.status === target).map((record: any) => record.studentId)));
  };

  const loadHistory = async () => {
    const res = await fetch("/api/attendance?view=history");
    if (res.ok) setHistory((await res.json()).sessions || []);
  };

  useEffect(() => {
    Promise.all([loadSubjects(), loadHistory()]).catch((error) => toast.error(error.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadClass().catch((error) => toast.error(error.message));
  }, [subjectId, date]);

  const counts = useMemo(() => ({
    selected: selected.size,
    present: mode === "present" ? selected.size : students.length - selected.size,
    absent: mode === "absent" ? selected.size : students.length - selected.size,
  }), [mode, selected, students.length]);

  const setModeAndSelection = (nextMode: Mode) => {
    setMode(nextMode);
    const current = existing?.records || [];
    setSelected(new Set(current.filter((record) => record.status === nextMode).map((record) => record.studentId)));
  };

  const toggleStudent = (studentId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const saveRecords = async (records: Array<{ studentId: string; status: Mode }>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, date, records }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save attendance.");
      toast.success(existing ? "Attendance updated." : "Attendance saved.");
      setExisting(data.session);
      await loadHistory();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => saveRecords(students.map((student) => ({ studentId: student.id, status: selected.has(student.id) ? mode : mode === "present" ? "absent" : "present" })));

  const handleImport = async (file: File) => {
    const form = new FormData();
    form.append("subjectId", subjectId);
    form.append("date", date);
    form.append("file", file);
    const res = await fetch("/api/attendance/import", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to preview the workbook.");
    setPreview(data.preview);
  };

  if (!isFaculty && !isAdmin) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-800">Faculty access is required.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Faculty workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Attendance</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Mark a class in seconds. One session per subject, class, and date.</p>
        </div>
        <a href="/api/attendance/template" className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Download className="h-4 w-4" /> Download Excel template
        </a>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="text-xs font-semibold text-slate-700">Subject
              <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500" disabled={loading}>
                <option value="">Select a subject</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} · {subject.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">Date
              <input type="date" value={date} max={today()} onChange={(event) => setDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500" />
            </label>
          </div>

          {existing && <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900"><CheckCircle2 className="h-4 w-4" /> Attendance already exists for this date. Saving will update it.</div>}

          <div className="mt-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Quick marking</h2>
              <p className="mt-1 text-xs text-slate-500">{mode === "present" ? "Selected students are present; everyone else is absent." : "Selected students are absent; everyone else is present."}</p>
            </div>
            <div className="flex rounded-lg border border-slate-300 bg-slate-50 p-1" role="group" aria-label="Attendance mode">
              {(["present", "absent"] as Mode[]).map((value) => <button key={value} type="button" onClick={() => setModeAndSelection(value)} className={`rounded-md px-3 py-2 text-xs font-semibold capitalize ${mode === value ? value === "present" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white" : "text-slate-600 hover:bg-white"}`}>{value === "present" ? "Mark present" : "Mark absent"}</button>)}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-900"><span>{counts.present} present</span><span className="text-slate-300">·</span><span>{counts.absent} absent</span></div>
            <div className="flex gap-2"><button type="button" onClick={() => setSelected(new Set(students.map((student) => student.id)))} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Select all</button><button type="button" onClick={() => setSelected(new Set())} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Clear all</button></div>
          </div>

          <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {students.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No active students were found for this subject.</p> : students.map((student) => <button key={student.id} type="button" onClick={() => toggleStudent(student.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"><span className={`flex h-6 w-6 items-center justify-center rounded-md border ${selected.has(student.id) ? mode === "present" ? "border-emerald-600 bg-emerald-600 text-white" : "border-rose-600 bg-rose-600 text-white" : "border-slate-300 bg-white text-transparent"}`}><Check className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-900">{student.name}</span><span className="block text-xs text-slate-500">{student.rollNumber}</span></span><span className="text-xs font-medium text-slate-400">{selected.has(student.id) ? mode : mode === "present" ? "absent" : "present"}</span></button>)}
          </div>
          <button type="button" disabled={saving || !subjectId || students.length === 0} onClick={handleSave} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving attendance…" : existing ? "Update attendance" : "Save attendance"}</button>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 font-semibold text-slate-900"><FileSpreadsheet className="h-4 w-4 text-amber-600" /> Import Excel</div><p className="mt-2 text-xs leading-relaxed text-slate-500">Upload the template, preview every row, then confirm. Invalid or incomplete files are never saved.</p><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4" /> Choose .xlsx<input type="file" accept=".xlsx" className="sr-only" onChange={(event) => event.target.files?.[0] && handleImport(event.target.files[0]).catch((error) => toast.error(error.message))} /></label></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 font-semibold text-slate-900"><History className="h-4 w-4 text-indigo-600" /> Recent sessions</div><div className="mt-3 space-y-2">{history.slice(0, 6).map((session) => <button type="button" key={session._id} onClick={() => { setSubjectId(session.subjectId); setDate(new Date(session.date).toISOString().slice(0, 10)); }} className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-left text-xs hover:bg-indigo-50"><span><span className="block font-medium text-slate-700">{session.subject?.code || "Subject"}</span><span className="text-slate-500">{new Date(session.date).toLocaleDateString()}</span></span><span className="text-slate-500">{session.records.filter((record) => record.status === "present").length}/{session.records.length}</span></button>)}{history.length === 0 && <p className="text-xs text-slate-500">No attendance sessions yet.</p>}</div></div>
        </aside>
      </section>

      {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Import preview</p><h2 className="mt-1 text-xl font-bold text-slate-900">Review before saving</h2><p className="mt-1 text-xs text-slate-500">{preview.studentsFound} students found · {preview.present} present · {preview.absent} absent</p></div><button type="button" onClick={() => setPreview(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close preview"><X className="h-5 w-5" /></button></div>{preview.errors.length > 0 && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><p className="font-semibold">{preview.errors.length} records need attention</p><ul className="mt-2 list-disc space-y-1 pl-4">{preview.errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul></div>}<div className="mt-4 max-h-80 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-100 text-slate-500"><tr><th className="px-3 py-2">Roll</th><th className="px-3 py-2">Student</th><th className="px-3 py-2">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{preview.records.map((record) => <tr key={record.studentId}><td className="px-3 py-2 font-mono">{record.rollNumber}</td><td className="px-3 py-2">{record.name}</td><td className={`px-3 py-2 font-semibold ${record.status === "present" ? "text-emerald-700" : "text-rose-700"}`}>{record.status}</td></tr>)}</tbody></table></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setPreview(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Cancel</button><button type="button" disabled={preview.errors.length > 0 || saving} onClick={() => { saveRecords(preview.records.map(({ studentId, status }) => ({ studentId, status }))).then(() => setPreview(null)); }} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Confirm & save</button></div></div></div>}
    </div>
  );
}
