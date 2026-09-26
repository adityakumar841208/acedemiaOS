"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function FacultyGradingPortal() {
  const { id } = useParams() as { id: string };
  const { user } = useUserSession();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [inspectSimilaritySub, setInspectSimilaritySub] = useState<Submission | null>(null);
  const [gradingSub, setGradingSub] = useState<Submission | null>(null);

  // Grade form state
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [gradingLoading, setGradingLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assignments/${id}`);
      if (res.ok) {
        const d = await res.json();
        setAssignment(d.assignment);
        setSubmissions(d.submissions || []);
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

  const handleOpenGrading = (sub: Submission) => {
    setGradingSub(sub);
    setMarks(sub.marks !== undefined ? sub.marks : Math.round(sub.maxMarks * 0.8));
    setFeedback(sub.feedback || "Good implementation of core balancing rotations.");
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub) return;

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

      toast.success(`Evaluated ${gradingSub.studentName}: ${marks}/${gradingSub.maxMarks}`);
      setGradingSub(null);
      await loadData();
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
          href="/faculty/assignments"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignments Studio</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Back button */}
      <Link
        href="/faculty/assignments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignment Studio</span>
      </Link>

      {/* Assignment Overview Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {assignment.subjectCode} - {assignment.subjectName}
            </span>
            <span className="text-xs text-slate-500">{assignment.moduleTitle}</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Total Marks: {assignment.totalMarks}
            </span>
            <span className="text-slate-400">
              Deadline: <strong>{formatDate(assignment.deadline)}</strong>
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Grading & Similarity Review: {assignment.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Review student code, inspect automated pairwise plagiarism alerts, and award marks with direct student feedback notifications.
        </p>
      </div>

      {/* Plagiarism Advisory Callout */}
      <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-amber-900">
            Automated Pairwise Plagiarism Engine Active
          </div>
          <p className="text-amber-800 leading-relaxed">
            Each submission is tokenized into 3-gram shingles and cross-checked against all other student submissions for this assignment. Overlaps above 25% are highlighted below with comparison badges.
          </p>
        </div>
      </div>

      {/* Submissions Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Student Submissions ({submissions.length})
            </h3>
          </div>

          <div className="text-xs text-slate-400">
            {submissions.filter((s) => s.status === "graded").length} of {submissions.length} Graded
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No submissions recorded yet for this assignment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Student</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Plagiarism / Similarity</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const isGraded = sub.status === "graded";
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900">{sub.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {sub.studentRoll} • {sub.fileName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-xs whitespace-nowrap">
                        {formatDate(sub.submittedAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            sub.status === "graded"
                              ? "bg-emerald-100 text-emerald-800"
                              : sub.status === "late"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      {/* Similarity column */}
                      <td className="py-3.5 px-4">
                        <SimilarityBadge
                          similarity={sub.similarity}
                          onClick={() => setInspectSimilaritySub(sub)}
                        />
                      </td>

                      {/* Marks */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {isGraded ? (
                          <span className="text-emerald-600 font-bold">
                            {sub.marks} / {sub.maxMarks}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Ungraded</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sub.similarity && sub.similarity.score > 20 && (
                            <button
                              onClick={() => setInspectSimilaritySub(sub)}
                              title="Compare Plagiarized Code Side-by-Side"
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              <span className="hidden sm:inline">Inspect</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
                          >
                            {isGraded ? "Update Grade" : "Evaluate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grading Drawer / Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  Evaluate Submission: {gradingSub.studentName}
                </h3>
                <p className="text-xs text-indigo-300">
                          Portal Roll No.: {gradingSub.studentRoll} • {gradingSub.fileName}
                </p>
              </div>
              <button
                onClick={() => setGradingSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitGrade} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Code viewer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Student Code / Submitted Solution:</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {gradingSub.fileSize}
                  </span>
                </label>
                <div className="bg-slate-950 text-slate-200 rounded-xl p-3.5 font-mono text-xs max-h-56 overflow-y-auto border border-slate-800 whitespace-pre-wrap leading-relaxed">
                  {gradingSub.content}
                </div>
              </div>

              {/* Marks & Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Award Marks (Max: {gradingSub.maxMarks}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={gradingSub.maxMarks}
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quick Grade Fill
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMarks(gradingSub.maxMarks)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hover:bg-emerald-100"
                    >
                      Full ({gradingSub.maxMarks})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarks(Math.round(gradingSub.maxMarks * 0.85))}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold hover:bg-blue-100"
                    >
                      85%
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarks(Math.round(gradingSub.maxMarks * 0.6))}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold hover:bg-amber-100"
                    >
                      60%
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qualitative Feedback for Student
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Suggestions for optimization, code style feedback, or citation remarks..."
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Sends automatic in-app notification to {gradingSub.studentName}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGradingSub(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={gradingLoading}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{gradingLoading ? "Saving..." : "Save & Notify Student"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plagiarism Comparison Modal */}
      <SimilarityDetailModal
        currentSubmission={inspectSimilaritySub}
        isOpen={Boolean(inspectSimilaritySub)}
        onClose={() => setInspectSimilaritySub(null)}
      />
    </div>
  );
}

