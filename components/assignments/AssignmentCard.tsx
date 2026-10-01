"use client";

import React from "react";
import Link from "next/link";
import { Assignment } from "@/types";
import { useUserSession } from "@/context/UserContext";
import DeadlineCountdown from "./DeadlineCountdown";
import { Award, ArrowRight, FileCheck, Layers, Users } from "lucide-react";
import { getAssignmentType } from "@/lib/assignment-types";

interface AssignmentCardProps {
  assignment: Assignment;
  submissionsCount?: number;
}

export default function AssignmentCard({
  assignment,
  submissionsCount,
}: AssignmentCardProps) {
  const { isFaculty } = useUserSession();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              {assignment.subjectCode}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{assignment.moduleTitle.slice(0, 24)}...</span>
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {getAssignmentType(assignment.assignmentType)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>{assignment.totalMarks} Marks</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
          {assignment.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
          {assignment.description}
        </p>

        {/* Real-time Deadline Bar */}
        <div className="mt-4">
          <DeadlineCountdown deadline={assignment.deadline} allowLate={assignment.allowLate} />
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="text-slate-400">
          <span>By </span>
          <strong className="text-slate-600 font-medium">{assignment.facultyName}</strong>
        </div>

        <div className="flex items-center gap-2">
          {isFaculty ? (
            <Link
              href={`/faculty/submissions/${assignment.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition-colors border border-amber-200"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Grade Submissions</span>
            </Link>
          ) : (
            <Link
              href={`/assignments/${assignment.id}`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm"
            >
              <span>View & Submit</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

