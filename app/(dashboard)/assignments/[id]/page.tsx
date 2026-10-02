"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUserSession } from "@/context/UserContext";
import { Assignment, Submission } from "@/types";
import DeadlineCountdown from "@/components/assignments/DeadlineCountdown";
import SimilarityBadge from "@/components/assignments/SimilarityBadge";
import SimilarityDetailModal from "@/components/assignments/SimilarityDetailModal";
import {
  FileCheck2,
  Award,
  Calendar,
  Lock,
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileCode,
  ShieldAlert,
  FileText,
  Clock,
  UserCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getAssignmentConfig, getAssignmentType } from "@/lib/assignment-types";

export default function AssignmentDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, isFaculty, refreshData } = useUserSession();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSimilaritySub, setSelectedSimilaritySub] = useState<Submission | null>(null);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assignments/${id}`);
      if (res.ok) {
        const d = await res.json();
        setAssignment(d.assignment);

        // Fetch actual persistent submission from server
        if (d.userSubmission) {
          setUserSubmission(d.userSubmission);
        } else if (Array.isArray(d.submissions)) {
          const existing = d.submissions.find(
            (s: Submission) => s.studentId === user?.id || s.studentName === user?.name
          );
          if (existing) {
            setUserSubmission(existing);
          } else {
            setUserSubmission(null);
          }
        } else {
          setUserSubmission(null);
        }
      }
    } catch (err) {
      console.error("Failed to load assignment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignment();
  }, [id, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent double submission clicks

    if (userSubmission) {
      toast.error("You have already submitted this assignment.");
      return;
    }

    const type = getAssignmentType(assignment?.assignmentType);
    if (type === "text" && !content.trim()) {
      toast.error("Please enter your written answer before submitting.");
      return;
    }
    if (type !== "text" && type !== "code" && selectedFiles.length === 0) {
      toast.error(`Please choose a ${getAssignmentConfig(type).label.toLowerCase()} file before submitting.`);
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("content", content);
      selectedFiles.forEach((file) => formData.append("files", file));
      if (fileName) formData.append("fileName", fileName);

      const res = await fetch(`/api/assignments/${id}/submit`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      // Success celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success(data.message || "Assignment submitted successfully!");
      setUserSubmission(data.submission);
      await refreshData();
      await loadAssignment();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Assignment Not Found</h2>
        <Link
          href="/assignments"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignments</span>
        </Link>
      </div>
    );
  }

  const isExpired = new Date(assignment.deadline) < new Date();
  const isLocked = isExpired && !assignment.allowLate;
  const assignmentType = getAssignmentType(assignment.assignmentType);
  const typeConfig = getAssignmentConfig(assignmentType);
  const isEvaluated = userSubmission && (userSubmission.status === "graded" || userSubmission.marks !== undefined);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Back Button */}
      <Link
        href="/assignments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Coursework</span>
      </Link>

      {/* Assignment Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              {assignment.subjectCode} - {assignment.subjectName}
            </span>
            <span className="text-xs text-slate-500">{assignment.moduleTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{assignment.totalMarks} Total Marks</span>
            </div>
            {isFaculty && (
              <Link
                href={`/faculty/submissions/${assignment.id}`}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                Grade All Submissions →
              </Link>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {assignment.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {assignment.description}
        </p>

        {/* Live Countdown & Status Banner */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <DeadlineCountdown
              deadline={assignment.deadline}
              allowLate={assignment.allowLate}
            />
            <span className="text-xs text-slate-400">
              Deadline: <strong>{formatDate(assignment.deadline)}</strong>
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Instructor: <strong>{assignment.facultyName}</strong>
          </div>
        </div>
      </div>

      {/* Instructions Box */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
          Faculty Guidelines & Academic Honesty Protocol
        </h3>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
          {assignment.instructions.map((inst, i) => (
            <li key={i}>{inst}</li>
          ))}
        </ul>
      </div>

      {/* Strict Deadline Lock Banner (if not submitted and deadline passed) */}
      {isLocked && !userSubmission && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 text-rose-900 flex items-start gap-3">
          <Lock className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">HARD DEADLINE LOCK ENGAGED</h4>
            <p className="text-xs leading-relaxed">
              The submission deadline for this assignment expired on{" "}
              {formatDate(assignment.deadline)}. In accordance with strict academic policy, the
              server rejects any new submission attempts.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSISTENT SUBMISSION VIEW: When already submitted (NOT SUBMITTED -> SUBMITTED -> EVALUATED) */}
      {/* ========================================================================= */}
      {userSubmission ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isEvaluated
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {isEvaluated ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <FileCheck2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <span>
                    {isEvaluated
                      ? "Assignment Evaluated & Graded"
                      : "Submission Recorded on Server"}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      isEvaluated
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : userSubmission.status === "late"
                        ? "bg-rose-50 text-rose-800 border border-rose-200"
                        : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                    }`}
                  >
                    {isEvaluated
                      ? "Evaluated"
                      : userSubmission.status === "late"
                      ? "Submitted Late"
                      : "Submitted"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Submitted on:{" "}
                    <strong>{formatDate(userSubmission.submittedAt)}</strong>
                  </span>
                </p>
              </div>
            </div>

            {/* Evaluation Marks Pill if graded */}
            {isEvaluated && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <Award className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    Final Score
                  </div>
                  <div className="text-lg font-extrabold text-emerald-900">
                    {userSubmission.marks} / {userSubmission.maxMarks || assignment.totalMarks}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Faculty Evaluation & Feedback Section */}
          {isEvaluated && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Instructor Evaluation & Feedback</span>
                </span>
                {(userSubmission.gradedBy || userSubmission.evaluatedBy) && (
                  <span className="text-xs text-emerald-700 font-medium">
                    Evaluated by:{" "}
                    <strong>{userSubmission.evaluatedBy || userSubmission.gradedBy}</strong>
                    {userSubmission.gradedAt && (
                      <span className="text-slate-400 ml-1">
                        ({formatDate(userSubmission.gradedAt)})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {userSubmission.feedback ? (
                <div className="p-4 bg-white rounded-xl border border-emerald-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed italic">
                  &ldquo;{userSubmission.feedback}&rdquo;
                </div>
              ) : (
                <p className="text-xs text-emerald-700 italic">
                  Graded with no written remarks.
                </p>
              )}
            </div>
          )}

          {/* Pending evaluation advisory note */}
          {!isEvaluated && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs leading-relaxed">
                <strong>Awaiting Instructor Evaluation:</strong> Your solution has been securely
                persisted to MongoDB. Once instructor <strong>{assignment.facultyName}</strong>{" "}
                completes the evaluation, your marks and personalized feedback will appear right here.
              </div>
            </div>
          )}

          {/* Submitted Content Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>Submitted Work ({userSubmission.fileName || "Solution"})</span>
                {userSubmission.fileSize && (
                  <span className="text-slate-400 font-normal">({userSubmission.fileSize})</span>
                )}
              </div>

              {/* Similarity Badge */}
              {userSubmission.similarity && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-normal">Similarity Score:</span>
                  <SimilarityBadge
                    similarity={userSubmission.similarity}
                    onClick={() => setSelectedSimilaritySub(userSubmission)}
                  />
                </div>
              )}
            </div>

            {/* Read-only Content Viewer */}
            <div className="rounded-2xl border border-slate-300 bg-slate-950 p-4 text-xs font-mono text-slate-100 overflow-x-auto max-h-96 leading-relaxed">
              <pre>{userSubmission.content}</pre>
            </div>

            {/* Uploaded Files if any */}
            {userSubmission.files && userSubmission.files.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-700">Attached Files:</span>
                <div className="flex flex-wrap gap-2">
                  {userSubmission.files.map((file, i) => (
                    <a
                      key={i}
                      href={file.url}
                      download={file.originalName}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{file.originalName}</span>
                      <span className="text-slate-400 text-[10px]">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Informational Footer: Submission is final */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>
              Academic Policy: Submissions are permanent records and cannot be resubmitted or deleted.
            </span>
            <span className="text-emerald-700 font-medium">✓ Record Verified</span>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SUBMISSION FORM: Only visible when NOT SUBMITTED and not locked */
        /* ========================================================================= */
        !isLocked && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-600" />
                  <span>Submit {typeConfig.label}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {typeConfig.description} Plagiarism detection runs automatically upon submission.
                </p>
              </div>

              {/* Helper buttons for code assignments */}
              {assignmentType === "code" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFileName("Aditya_AVL_Solution.cpp");
                      setContent(`// Original AVL Tree Implementation
// Student: ${user?.name || "Student"} (${user?.rollNumber || "CS22B1045"})
#include <iostream>
using namespace std;

class AVLTree {
    struct Node {
        int val;
        int height;
        Node *left, *right;
        Node(int v) : val(v), height(1), left(nullptr), right(nullptr) {}
    };
    Node* root = nullptr;

    int height(Node* n) { return n ? n->height : 0; }
    int getBalance(Node* n) { return n ? height(n->left) - height(n->right) : 0; }
    
public:
    void insert(int key) {
        // Balanced BST insertion logic
    }
};
int main() {
    AVLTree tree;
    tree.insert(10);
    return 0;
}`);
                      toast.info("Sample source code inserted!");
                    }}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>Insert Original Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFileName("Copied_Solution_Demo.cpp");
                      setContent(`// Testing Plagiarism Detector
#include <iostream>
#include <algorithm>
using namespace std;

struct Node {
    int key;
    Node *left;
    Node *right;
    int height;
    Node(int k) : key(k), left(nullptr), right(nullptr), height(1) {}
};

int getHeight(Node *n) { return n ? n->height : 0; }
int getBalance(Node *n) { return n ? getHeight(n->left) - getHeight(n->right) : 0; }

Node* rightRotate(Node *y) {
    Node *x = y->left;
    Node *T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
    x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
    return x;
}`);
                      toast.warning("Plagiarism test snippet inserted!");
                    }}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-medium flex items-center gap-1 transition-colors"
                  >
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    <span>Insert Overlapping Code</span>
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {assignmentType === "code" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    File Name / Solution Identifier
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    disabled={submitting}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. Solution_AVLTree.cpp"
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {(assignmentType === "code" || assignmentType === "text") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {assignmentType === "code" ? "Source Code *" : "Your Answer *"}
                  </label>
                  <textarea
                    rows={12}
                    value={content}
                    disabled={submitting}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste or write your program code or text response here..."
                    className="w-full text-xs text-white! font-mono rounded-xl border border-slate-300 p-3.5 bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              )}

              {assignmentType !== "text" && (
                <div>
                  <label
                    className="block text-xs font-semibold text-slate-700 mb-1"
                    htmlFor="submission-files"
                  >
                    {assignmentType === "code"
                      ? "Upload Source Files (optional)"
                      : `Upload ${typeConfig.label} *`}
                  </label>
                  <input
                    id="submission-files"
                    type="file"
                    accept={typeConfig.accept}
                    multiple={typeConfig.maxFiles > 1}
                    disabled={submitting}
                    onChange={(e) =>
                      setSelectedFiles(
                        Array.from(e.target.files || []).slice(0, typeConfig.maxFiles)
                      )
                    }
                    className="w-full text-xs rounded-xl border border-dashed border-slate-300 p-3 text-slate-700 bg-slate-50 disabled:opacity-60"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Accepted: {typeConfig.accept || "none"}. Maximum {typeConfig.maxFiles} file
                    {typeConfig.maxFiles === 1 ? "" : "s"}; single submission policy enforced.
                  </p>
                  {selectedFiles.length > 0 && (
                    <p className="mt-1 text-[11px] text-emerald-700">
                      Selected: {selectedFiles.map((file) => file.name).join(", ")}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-400">
                  Submitting as: <strong>{user?.name || "Student"}</strong> ({user?.rollNumber || "ID"})
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Analyzing & Submitting..." : "Submit Assignment"}</span>
                </button>
              </div>
            </form>
          </div>
        )
      )}

      {/* Similarity Detail Modal */}
      <SimilarityDetailModal
        currentSubmission={selectedSimilaritySub}
        isOpen={Boolean(selectedSimilaritySub)}
        onClose={() => setSelectedSimilaritySub(null)}
      />
    </div>
  );
}
