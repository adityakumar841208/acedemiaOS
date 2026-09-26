"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, GraduationCap, Lock } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to reset password."); else setMessage(data.message);
    } catch { setError("Unable to reach the server. Please try again."); } finally { setLoading(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><section className="w-full max-w-md"><Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 text-xl font-bold"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600"><GraduationCap className="h-5 w-5" /></span>Academia<span className="text-indigo-400">OS</span></Link><div className="border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-9"><h1 className="text-2xl font-bold">Choose a new password</h1><p className="mt-2 text-sm text-slate-400">Your reset link is valid for 30 minutes.</p>{error && <p className="mt-5 border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}{message ? <div className="mt-6"><p className="border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p><Link href="/login" className="mt-5 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Continue to sign in</Link></div> : <form onSubmit={handleSubmit} className="mt-6 space-y-4"><label className="block text-sm font-medium text-slate-300">New password<div className="relative mt-2"><Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500" /></div></label><label className="block text-sm font-medium text-slate-300">Confirm password<input required minLength={6} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 w-full border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500" /></label><button disabled={loading || !token} className="w-full bg-indigo-600 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60">{loading ? "Updating..." : "Update password"}</button></form>}</div></section></main>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></main>}><ResetPasswordForm /></Suspense>;
}
