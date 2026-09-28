"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUserSession } from "@/context/UserContext";
import { Assignment, Submission } from "@/types";
import SimilarityBadge from "@/components/assignments/SimilarityBadge";
import SimilarityDetailModal from "@/components/assignments/SimilarityDetailModal";
import {
  Award,
  ArrowLeft,
  Users,
  ShieldAlert,
  CheckCircle2,
  FileCode,
  Calendar,
  Sparkles,
  X,
  Send,
  Eye,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  FileCheck2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface EnrolledStudent {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  semester: number;
}

export default function FacultyGradingPortal() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useUserSession();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notSubmittedList, setNotSubmittedList] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Category Tab: PENDING | EVALUATED | LATE | NOT_SUBMITTED
  const [activeTab, setActiveTab] = useState<"PENDING" | "EVALUATED" | "LATE" | "NOT_SUBMITTED">("PENDING");

  // Modals state
  const [inspectSimilaritySub, setInspectSimilaritySub] = useState<Submission | null>(null);
  const [gradingSub, setGradingSub] = useState<Submission | null>(null);

  // Grade form state & Unsaved changes guard
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assignments/${id}`);
      if (res.ok) {
        const d = await res.json();
        setAssignment(d.assignment);
        setSubmissions(d.submissions || []);
        if (d.categories && d.categories.notSubmitted) {
          setNotSubmittedList(d.categories.notSubmitted);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Derived categorized submissions
  const pendingSubmissions = submissions.filter((s) => s.status !== "graded" || s.marks === undefined);
  const evaluatedSubmissions = submissions.filter((s) => s.status === "graded" && s.marks !== undefined);
  const lateSubmissions = submissions.filter(
    (s) => s.status === "late" || (assignment && s.submittedAt && new Date(s.submittedAt) > new Date(assignment.deadline))
  );

  // Default tab selection on load: if pending > 0 choose PENDING, else EVALUATED
  useEffect(() => {
    if (!loading && submissions.length > 0) {
      if (pendingSubmissions.length > 0) {
        setActiveTab("PENDING");
      } else if (evaluatedSubmissions.length > 0) {
        setActiveTab("EVALUATED");
      }
    }
  }, [loading, submissions.length, pendingSubmissions.length]);

  // Current list based on active tab for sequence navigation
  const currentCategorySubmissions =
    activeTab === "PENDING"
      ? pendingSubmissions
      : activeTab === "EVALUATED"
      ? evaluatedSubmissions
      : lateSubmissions;

  const currentStudentIndex = gradingSub
    ? currentCategorySubmissions.findIndex((s) => s.id === gradingSub.id)
    : -1;

  const handleOpenGrading = (sub: Submission) => {
    setGradingSub(sub);
    setMarks(sub.marks !== undefined ? sub.marks : Math.round((assignment?.totalMarks || 20) * 0.8));
    setFeedback(sub.feedback || "Good implementation of required algorithm logic.");
    setIsFormDirty(false);
  };

  const handleSafeCloseGrading = () => {
    if (isFormDirty) {
      setShowDiscardConfirm(true);
    } else {
      setGradingSub(null);
      setIsFormDirty(false);
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    setIsFormDirty(false);
    setGradingSub(null);
  };

  const handleNavigateStudent = (direction: "prev" | "next") => {
    if (currentStudentIndex === -1) return;
    const targetIdx = direction === "prev" ? currentStudentIndex - 1 : currentStudentIndex + 1;
    if (targetIdx >= 0 && targetIdx < currentCategorySubmissions.length) {
      const nextSub = currentCategorySubmissions[targetIdx];
      handleOpenGrading(nextSub);
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub || !assignment) return;

    if (marks < 0 || marks > assignment.totalMarks) {
      toast.error(`Marks must be between 0 and ${assignment.totalMarks}.`);
      return;
    }

    try {
      setGradingLoading(true);
      const res = await fetch(`/api/submissions/${gradingSub.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marks: Number(marks),
          feedback,
          gradedBy: user?.name || "Course Instructor",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit grade");
      }

      toast.success(`Evaluated ${gradingSub.studentName}: ${marks}/${assignment.totalMarks}`);
      setIsFormDirty(false);

      // Determine next pending student if applicable
      const nextPending = pendingSubmissions.find((s) => s.id !== gradingSub.id);
      await loadData();

      if (nextPending && activeTab === "PENDING") {
        handleOpenGrading(nextPending);
      } else {
        setGradingSub(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Grading submission failed");
    } finally {
      setGradingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Assignment Not Found</h2>
        <Link
          href="/faculty/submissions"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignment Selection</span>
        </Link>
      </div>
    );
  }

  const evaluatedCount = evaluatedSubmissions.length;
  const totalSubmissions = submissions.length;
  const progressPct = totalSubmissions > 0 ? Math.round((evaluatedCount / totalSubmissions) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Breadcrumb Navigation & Return Action */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <nav className="flex items-center gap-1.5 text-slate-500">
          <Link href="/faculty/submissions" className="hover:text-slate-900 font-medium transition-colors">
            Grade Submission
          </Link>
          <span>/</span>
          <Link href="/faculty/submissions" className="hover:text-slate-900 font-medium transition-colors">
            Assignments
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[260px] sm:max-w-md">
            {assignment.title}
          </span>
        </nav>

        <Link
          href="/faculty/submissions"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Assignment</span>
        </Link>
      </div>

      {/* Assignment Context Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono">
              {assignment.subjectCode} - {assignment.subjectName}
            </span>
            <span className="text-xs text-slate-500">{assignment.moduleTitle}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Total Marks: {assignment.totalMarks}
            </span>
            <span className="text-slate-500">
              Deadline: <strong className="text-slate-800">{formatDate(assignment.deadline)}</strong>
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {assignment.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          {assignment.description}
        </p>

        {/* Live Statistics Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-medium">Submissions:</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{totalSubmissions} received</div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
            <span className="text-amber-800 font-medium">Pending Evaluation:</span>
            <div className="text-lg font-bold text-amber-900 mt-0.5">{pendingSubmissions.length} students</div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-emerald-800 font-medium">Completed:</span>
            <div className="text-lg font-bold text-emerald-900 mt-0.5">{evaluatedCount} graded</div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <span className="text-indigo-800 font-medium">Progress:</span>
            <div className="text-lg font-bold text-indigo-900 mt-0.5">{progressPct}% evaluated</div>
          </div>
        </div>
      </div>

      {/* 4 Categorization Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === "PENDING" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Pending Evaluation</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "PENDING" ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-800"}`}>
            {pendingSubmissions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("EVALUATED")}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === "EVALUATED" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Evaluated</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "EVALUATED" ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-800"}`}>
            {evaluatedSubmissions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("LATE")}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === "LATE" ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Late Submissions</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "LATE" ? "bg-red-700 text-white" : "bg-red-100 text-red-800"}`}>
            {lateSubmissions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("NOT_SUBMITTED")}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === "NOT_SUBMITTED" ? "bg-slate-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Not Submitted</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "NOT_SUBMITTED" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"}`}>
            {notSubmittedList.length}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "NOT_SUBMITTED" ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
            <span>Enrolled Students with no submission recorded ({notSubmittedList.length})</span>
            <span className="text-[11px] text-slate-400">Read-only class tracking view</span>
          </div>

          {notSubmittedList.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              All enrolled students have turned in this assignment!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {notSubmittedList.map((st) => (
                <div key={st.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <div className="font-bold text-slate-900">{st.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">Roll: {st.rollNumber}</div>
                  <div className="text-[10px] text-amber-700 font-medium">Pending Turn-in</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentCategorySubmissions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-xs text-slate-400">
              No submissions found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentCategorySubmissions.map((sub) => {
                const isGraded = sub.status === "graded" && sub.marks !== undefined;
                const isLate = sub.status === "late" || (assignment && sub.submittedAt && new Date(sub.submittedAt) > new Date(assignment.deadline));

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{sub.studentName}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {sub.studentRoll}
                        </span>
                        {isLate && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            Late Submission
                          </span>
                        )}
                        {isGraded ? (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Graded: {sub.marks}/{assignment.totalMarks}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Needs Grading
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Submitted: {new Date(sub.submittedAt).toLocaleString()}</span>
                        </div>
                        {sub.fileName && (
                          <div className="flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.fileName}</span>
                          </div>
                        )}
                      </div>

                      {/* Feedback Snippet if graded */}
                      {sub.feedback && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-2xl italic">
                          &quot;{sub.feedback}&quot;
                        </p>
                      )}
                    </div>

                    {/* Actions & Similarity */}
                    <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                      {sub.similarity && (
                        <SimilarityBadge
                          score={sub.similarity.score}
                          onClick={() => setInspectSimilaritySub(sub)}
                        />
                      )}

                      <button
                        onClick={() => handleOpenGrading(sub)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 ${
                          isGraded
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                            : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"
                        }`}
                      >
                        {isGraded ? <Eye className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                        <span>{isGraded ? "Update Grade" : "Evaluate"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Grade Submission Modal with Sequence Navigation & Unsaved Changes Guard */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header with Student Prev / Next Sequence controls */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Evaluate: {gradingSub.studentName}
                    </h2>
                    <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded">
                      {gradingSub.studentRoll}
                    </span>
                    {isFormDirty && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                        Unsaved Edits
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Submission turned in on {new Date(gradingSub.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Prev / Next controls & Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigateStudent("prev")}
                  disabled={currentStudentIndex <= 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors"
                  title="Previous Student"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentStudentIndex + 1}/{currentCategorySubmissions.length}
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigateStudent("next")}
                  disabled={currentStudentIndex >= currentCategorySubmissions.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors"
                  title="Next Student"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSafeCloseGrading}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Submission Code Snippet */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-slate-500" />
                    <span>Submitted Code / Solution ({gradingSub.fileName || "Solution.cpp"})</span>
                  </div>
                  {gradingSub.similarity && (
                    <SimilarityBadge
                      score={gradingSub.similarity.score}
                      onClick={() => setInspectSimilaritySub(gradingSub)}
                    />
                  )}
                </div>
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                  {gradingSub.content}
                </pre>
              </div>

              {/* Grading Input Form */}
              <form onSubmit={handleSubmitGrade} className="space-y-4 pt-2">
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Marks Awarded (Max: {assignment.totalMarks})
                    </label>

                    {/* Quick ratio shortcuts */}
                    <div className="flex items-center gap-1 text-[11px]">
                      {[1.0, 0.8, 0.6, 0.4].map((ratio) => {
                        const calculated = Math.round(assignment.totalMarks * ratio);
                        return (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => {
                              setMarks(calculated);
                              setIsFormDirty(true);
                            }}
                            className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold transition-colors"
                          >
                            {ratio * 100}% ({calculated})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <input
                    type="number"
                    min="0"
                    max={assignment.totalMarks}
                    value={marks}
                    onChange={(e) => {
                      setMarks(Number(e.target.value));
                      setIsFormDirty(true);
                    }}
                    required
                    className="w-full px-3 py-2.5 text-base font-bold text-slate-900 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Evaluator Feedback & Recommendations</span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback("Outstanding solution. Clean rotation invariants and concise logic.");
                          setIsFormDirty(true);
                        }}
                        className="hover:text-amber-600 transition-colors"
                      >
                        + Clean
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback("Good work overall. Review memory cleanup in destructor and edge cases.");
                          setIsFormDirty(true);
                        }}
                        className="hover:text-amber-600 transition-colors"
                      >
                        + Memory
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => {
                      setFeedback(e.target.value);
                      setIsFormDirty(true);
                    }}
                    placeholder="Provide constructive feedback for the student..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  />
                </div>

                {/* Footer Submit Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSafeCloseGrading}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={gradingLoading}
                    className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                  >
                    {gradingLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Grade...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Grade & Notify Student</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Unsaved changes confirmation dialog */}
            {showDiscardConfirm && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Discard unsaved grade?</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      You modified the marks or feedback. Leaving now will discard your unsaved changes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDiscardConfirm(false)}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Keep Grading
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDiscard}
                      className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Similarity Detail Inspector Modal */}
      {inspectSimilaritySub && (
        <SimilarityDetailModal
          submission={inspectSimilaritySub}
          onClose={() => setInspectSimilaritySub(null)}
        />
      )}
    </div>
  );
}
