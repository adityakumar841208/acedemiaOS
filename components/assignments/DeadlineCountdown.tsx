"use client";

import React, { useState, useEffect } from "react";
import { getTimeRemaining } from "@/lib/utils";
import { Clock, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface DeadlineCountdownProps {
  deadline: string;
  allowLate?: boolean;
  onExpire?: () => void;
}

export default function DeadlineCountdown({
  deadline,
  allowLate = false,
  onExpire,
}: DeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(deadline);
      setTimeLeft(remaining);
      if (remaining.isExpired && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
        <Lock className="w-3.5 h-3.5 text-rose-600" />
        <span>Submission Deadline Passed</span>
        {allowLate ? (
          <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-normal">
            Late Allowed
          </span>
        ) : (
          <span className="text-[10px] text-rose-800 bg-rose-200/60 px-1.5 py-0.2 rounded uppercase font-bold">
            Hard Locked
          </span>
        )}
      </div>
    );
  }

  if (timeLeft.isUrgent) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold animate-pulse">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Closing Soon:</span>
        <div className="flex items-center gap-1 font-mono text-amber-800">
          <span className="bg-amber-200 px-1.5 py-0.5 rounded font-bold">
            {String(timeLeft.hours).padStart(2, "0")}h
          </span>
          <span>:</span>
          <span className="bg-amber-200 px-1.5 py-0.5 rounded font-bold">
            {String(timeLeft.minutes).padStart(2, "0")}m
          </span>
          <span>:</span>
          <span className="bg-amber-200 px-1.5 py-0.5 rounded font-bold">
            {String(timeLeft.seconds).padStart(2, "0")}s
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs">
      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
      <span className="text-slate-500 font-medium">Due in:</span>
      <div className="flex items-center gap-1 font-mono text-slate-800 font-semibold">
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{timeLeft.hours}h</span>
        <span>{timeLeft.minutes}m</span>
        <span>{timeLeft.seconds}s</span>
      </div>
    </div>
  );
}

