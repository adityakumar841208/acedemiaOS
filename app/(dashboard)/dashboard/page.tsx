"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUserSession } from "@/context/UserContext";
import {
  Subject,
  Resource,
  Assignment,
  Announcement,
  Submission,
} from "@/types";
import DeadlineCountdown from "@/components/assignments/DeadlineCountdown";
import SimilarityBadge from "@/components/assignments/SimilarityBadge";
import PDFPreviewModal from "@/components/resources/PDFPreviewModal";
import {
  BookOpen,
  FolderArchive,
  FileCheck2,
  Megaphone,
  Award,
  Users,
  Clock,
  ArrowRight,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import PendingStudentApprovals from "@/components/auth/PendingStudentApprovals";

export default function DashboardPage() {
  const { user, currentRole, isStudent, isFaculty, isCR, isAdmin } =
    useUserSession();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // PDF Preview Modal
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [subRes, resRes, assignRes, submRes, annRes] = await Promise.all([
          fetch("/api/subjects"),
          fetch("/api/resources"),
          fetch("/api/assignments"),
          fetch("/api/submissions"),
          fetch("/api/announcements"),
        ]);

        if (subRes.ok) {
          const d = await subRes.json();
          setSubjects(d.subjects || []);
        }
        if (resRes.ok) {
          const d = await resRes.json();
          setResources(d.resources || []);
        }
        if (assignRes.ok) {
          const d = await assignRes.json();
          setAssignments(d.assignments || []);
        }
        if (submRes.ok) {
          const d = await submRes.json();
          setSubmissions(d.submissions || []);
        }
        if (annRes.ok) {
          const d = await annRes.json();
          setAnnouncements(d.announcements || []);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownload = async (res: Resource) => {
    try {
      await fetch(`/api/resources/${res.id}/download`, { method: "POST" });
      setResources((prev) =>
        prev.map((r) =>
          r.id === res.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
        )
      );
      toast.success(`Downloading ${res.title}...`);
    } catch {
      toast.error("Download failed");
    }
  };

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();

    const greetings = {
      morning: [
        "Good morning",
        "Morning",
        "Hope you're having a good morning",
        "A good morning to you",
      ],
      afternoon: [
        "Good afternoon",
        "Hope your afternoon is going well",
        "Good to see you this afternoon",
      ],
      evening: [
        "Good evening",
        "Hope you're having a good evening",
        "Good to see you this evening",
      ],
      night: [
        "Good night",
        "Hope you had a good day",
        "Good to see you",
      ],
    };

    const period =
      hour >= 5 && hour < 12
        ? "morning"
        : hour >= 12 && hour < 17
          ? "afternoon"
          : hour >= 17 && hour < 21
            ? "evening"
            : "night";

    const options = greetings[period];

    return `${options[Math.floor(Math.random() * options.length)]}, ${user?.name || "Student"
      }`;
  }, [user?.name]);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Academic Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      <PendingStudentApprovals />
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-[#4b350d] via-slate-900 to-[#1b1710] rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-amber-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/15 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-200 mb-1">
              <span>{user?.department ? `${user.department} Department` : "Academic Portal"}</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">{user?.role || "STUDENT"}</span>
            </div>
            {/* <h1 className="text-2xl sm:text-3xl font-bold tracking-tight"> */}
            {/* {getGreeting(user?.name || "Student")} */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {greeting}
            </h1>


            {/* </h1> */}
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              {isStudent && "Access your subjects, verified notes, and upcoming lab assignment deadlines."}
              {isFaculty && "Review student code submissions, inspect similarity matches, and update coursework."}
              {isCR && "Publish official class announcements and upload semester study packs."}
              {isAdmin && "Monitor cross-department academic progress, course health, and system telemetry."}
            </p>
          </div>

          {/* Quick Actions based on role */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isFaculty && (
              <Link
                href="/faculty/assignments"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Assignment</span>
              </Link>
            )}
            {isCR && (
              <Link
                href="/cr/announcements"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
              >
                <Megaphone className="w-4 h-4" />
                <span>Post Broadcast</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      {(isFaculty || isAdmin) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Enrolled Subjects</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{subjects.length}</div>
              <div className="text-[11px] text-indigo-600 mt-0.5">CSE 3rd Semester</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Resource Vault</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{resources.length}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Notes, PYQs, Slides</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Assignments</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{assignments.length}</div>
              <div className="text-[11px] text-amber-600 mt-0.5">
                {assignments.filter((a) => new Date(a.deadline) > new Date()).length} Active
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">
                {isFaculty ? "Submissions" : "Attendance Rate"}
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {isFaculty ? submissions.length : "89%"}
              </div>
              <div className="text-[11px] text-indigo-600 mt-0.5">
                {isFaculty ? "Awaiting review" : "Min. 75% required"}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide): Active Deadlines & Subjects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignments & Countdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {isFaculty ? "Active Course Assignments" : "Pending Assignments & Deadlines"}
                </h2>
                <p className="text-xs text-slate-500">
                  Hard server-enforced deadline countdown lock
                </p>
              </div>
              <Link
                href="/assignments"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {assignments.map((assignment) => {
                const isExpired = new Date(assignment.deadline) < new Date();
                return (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {assignment.subjectCode}
                        </span>
                        <span className="text-xs text-slate-500">
                          {assignment.moduleTitle}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {assignment.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {assignment.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <DeadlineCountdown
                        deadline={assignment.deadline}
                        allowLate={assignment.allowLate}
                      />

                      {isFaculty ? (
                        <Link
                          href={`/faculty/submissions/${assignment.id}`}
                          className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 rounded-lg font-semibold transition-colors"
                        >
                          Grade Submissions →
                        </Link>
                      ) : (
                        <Link
                          href={`/assignments/${assignment.id}`}
                          className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${isExpired
                            ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                            }`}
                        >
                          {isExpired ? "Submission Closed" : "Submit Lab Code →"}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subjects Hierarchy Quick Access */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Semester 3 Subjects & Syllabus
                </h2>
                <p className="text-xs text-slate-500">
                  Click a subject to inspect module notes, slides, and syllabus
                </p>
              </div>
              <Link
                href="/subjects"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects.map((s) => (
                <Link
                  key={s.id}
                  href={`/subjects/${s.id}`}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition-all group bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {s.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {s.credits} Credits • {s.modulesCount} Modules
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                    {s.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{s.facultyName}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Broadcasts & Recent Resources */}
        <div className="space-y-6">
          {/* Recent Resources in Vault */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <FolderArchive className="w-4 h-4 text-indigo-600" />
                <span>Recent Vault Uploads</span>
              </h3>
              <Link
                href="/resources"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Vault →
              </Link>
            </div>

            <div className="space-y-2.5">
              {resources.slice(0, 3).map((res) => (
                <div
                  key={res.id}
                  onClick={() => setPreviewResource(res)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                      {res.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{res.subjectCode}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 line-clamp-1">
                    {res.title}
                  </h4>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{res.fileSize}</span>
                    <span>{formatRelativeTime(res.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements & Broadcasts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>Class Announcements</span>
              </h3>
              <Link
                href="/announcements"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-700">{ann.category}</span>
                    <span className="text-slate-400">{formatRelativeTime(ann.createdAt)}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 line-clamp-1">{ann.title}</h4>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Document Preview Modal */}
      <PDFPreviewModal
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
        onDownload={handleDownload}
      />
    </div>
  );
}

