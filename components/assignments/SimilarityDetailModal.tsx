"use client";

import React from "react";
import { Submission } from "@/types";
import { X, ShieldAlert, GitCompare, FileCode, Check, AlertTriangle } from "lucide-react";

interface SimilarityDetailModalProps {
  currentSubmission: Submission | null;
  targetSubmission?: Submission | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SimilarityDetailModal({
  currentSubmission,
  targetSubmission,
  isOpen,
  onClose,
}: SimilarityDetailModalProps) {
  if (!isOpen || !currentSubmission || !currentSubmission.similarity) return null;

  const sim = currentSubmission.similarity;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {sim.score}% High Similarity
                </span>
                <span className="text-xs text-slate-400">
                  Token Shingle (3-gram) Overlap
                </span>
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-white mt-0.5">
                Plagiarism Inspector: {currentSubmission.studentName} vs {sim.matchedWithStudentName}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400">Similarity Metric</div>
            <div className="text-lg font-bold text-rose-400 mt-0.5">{sim.score}% Match</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400">Identical 3-Grams</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{sim.overlappingTokensCount} tokens</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400">Primary Candidate</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
              {currentSubmission.studentName}
            </div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400">Comparison Source</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
              {sim.matchedWithStudentName}
            </div>
          </div>
        </div>

        {/* Matched Sentences / Key Phrases */}
        {sim.matchedPhrases && sim.matchedPhrases.length > 0 && (
          <div className="p-4 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Extracted Overlapping Statement Fragments:</span>
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-2">
              {sim.matchedPhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-amber-950/40 text-amber-200/90 p-2 rounded border border-amber-900/50 font-mono text-[11px]"
                >
                  &ldquo;{phrase}&rdquo;
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Side-by-Side Code / Text Inspector */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Current Submission */}
          <div className="flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-slate-200">
                  {currentSubmission.studentName} ({currentSubmission.studentRoll})
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                {currentSubmission.fileName || "submission.cpp"}
              </span>
            </div>
            <div className="flex-1 p-3 overflow-x-auto font-mono text-xs text-slate-300 bg-slate-950/70 whitespace-pre-wrap leading-relaxed select-text">
              {currentSubmission.content}
            </div>
          </div>

          {/* Right: Matched Peer Submission */}
          <div className="flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-slate-200">
                  {sim.matchedWithStudentName} (Earlier Submission)
                </span>
              </div>
              <span className="text-rose-400 font-mono text-[11px]">Matched Baseline</span>
            </div>
            <div className="flex-1 p-3 overflow-x-auto font-mono text-xs text-slate-300 bg-slate-950/70 whitespace-pre-wrap leading-relaxed select-text">
              {targetSubmission ? targetSubmission.content : currentSubmission.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Powered by n-gram token shingling & pairwise Jaccard analysis
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Dismiss Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

