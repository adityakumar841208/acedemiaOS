"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserSession } from "@/context/UserContext";
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const { refreshUser } = useUserSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setErrorCode("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Login failed");
        setErrorCode(data.code || "AUTH_ERROR");
        return;
      }

      toast.success(`Welcome back, ${data.user.name}!`);
      await refreshUser();

      // Destination is strictly determined by server based on user's real role
      const destination = from || data.redirectTo || "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-950/35 via-slate-950 to-slate-950 pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
            <Image
            src="/logo.png"
                        alt="Logo"
                        width={60}
                        height={60}
                        className="w-full h-full object-cover rounded"
                      />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">
            Academia<span className="text-amber-300">OS</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Sign In to Your Academic Portal
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
          Enter your credentials to access your courses, resources, and grades.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{errorMsg}</span>
                {errorCode === "ACCOUNT_NOT_FOUND" && (
                  <Link
                    href="/register"
                    className="inline-block text-indigo-400 hover:text-indigo-300 underline font-medium"
                  >
                    Need an account? Click here to register as Student.
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  className="w-full text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Accordion for Evaluators */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Evaluator Demo Accounts:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo("aditya.student@campus.edu", "StudentPass123!")}
                className="p-2 rounded-lg bg-slate-800/70 hover:bg-indigo-600/20 border border-slate-700/80 text-left text-xs transition-colors"
              >
                <div className="font-semibold text-indigo-300">🎓 Student</div>
                <div className="text-[10px] text-slate-400 truncate">aditya.student@...</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("priya.cr@campus.edu", "CrPass123!")}
                className="p-2 rounded-lg bg-slate-800/70 hover:bg-emerald-600/20 border border-slate-700/80 text-left text-xs transition-colors"
              >
                <div className="font-semibold text-emerald-300">📢 CR</div>
                <div className="text-[10px] text-slate-400 truncate">priya.cr@...</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("sharma.faculty@campus.edu", "FacultyPass123!")}
                className="p-2 rounded-lg bg-slate-800/70 hover:bg-amber-600/20 border border-slate-700/80 text-left text-xs transition-colors"
              >
                <div className="font-semibold text-amber-300">👨‍🏫 Faculty</div>
                <div className="text-[10px] text-slate-400 truncate">sharma.faculty@...</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("admin@campus.edu", "AdminPass123!")}
                className="p-2 rounded-lg bg-slate-800/70 hover:bg-purple-600/20 border border-slate-700/80 text-left text-xs transition-colors"
              >
                <div className="font-semibold text-purple-300">🛡️ Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@campus.edu</div>
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div className="text-center pt-2 text-xs text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="text-amber-300 hover:text-amber-200 font-semibold underline"
            >
              Register as Student
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

