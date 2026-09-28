"use client";

import React from "react";
import { SimilarityDetail } from "@/types";
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface SimilarityBadgeProps {
  similarity?: SimilarityDetail | null;
  score?: number;
  onClick?: () => void;
}

export default function SimilarityBadge({
  similarity,
  score,
  onClick,
}: SimilarityBadgeProps) {
  const actualScore = score !== undefined ? score : similarity?.score;

  if (actualScore === undefined || actualScore <= 15) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Original ({actualScore !== undefined ? `${actualScore}%` : "0%"})</span>
      </span>
    );
  }

  const isCritical = actualScore >= 50;
  const matchedName = similarity?.matchedWithStudentName || "Peer";

  return (
    <button
      type="button"
      onClick={onClick}
      title="Click to view side-by-side plagiarism comparison"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-transform hover:scale-105 cursor-pointer ${
        isCritical
          ? "bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-400"
          : "bg-amber-100 text-amber-800 border-amber-300"
      }`}
    >
      {isCritical ? (
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      )}
      <span>{actualScore}% Overlap</span>
      <span className="text-[10px] text-slate-500 font-normal underline ml-0.5">
        vs {matchedName.split(" ")[0]}
      </span>
    </button>
  );
}

