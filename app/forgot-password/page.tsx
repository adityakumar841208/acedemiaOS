"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to send reset email."); else setMessage(data.message);
    } catch { setError("Unable to reach the server. Please try again."); } finally { setLoading(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><section className="w-full max-w-md"><Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 text-xl font-bold"> <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600"><GraduationCap className="h-5 w-5" /></span>Academia<span className="text-indigo-400">OS</span></Link><div className="border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-9"><h1 className="text-2xl font-bold">Reset your password</h1><p className="mt-2 text-sm leading-6 text-slate-400">Enter the email connected to your portal account and we&apos;ll send a secure reset link.</p>{error && <p className="mt-5 border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}{message && <p className="mt-5 border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>}<form onSubmit={handleSubmit} className="mt-6 space-y-4"><label className="block text-sm font-medium text-slate-300">Email address<div className="relative mt-2"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500" placeholder="name@campus.edu" /></div></label><button disabled={loading} className="w-full bg-indigo-600 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60">{loading ? "Sending..." : "Send reset link"}</button></form><Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link></div></section></main>;
}
