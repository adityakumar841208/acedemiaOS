import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import PublicFooter from "@/components/layout/PublicFooter";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800/80 bg-slate-950/90"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/" className="font-bold">Academia<span className="text-indigo-400">OS</span></Link><Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back home</Link></div></header>
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Contact</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Let&apos;s keep the portal moving.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">For account approvals, access issues, or project feedback, reach the portal team directly. Include your name, department, and portal roll no. when relevant.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <a href="mailto:adityasah841208@gmail.com" className="group border border-slate-800 bg-slate-900/70 p-6 transition hover:border-indigo-500"><Mail className="h-6 w-6 text-indigo-400" /><h2 className="mt-5 font-semibold">Email support</h2><p className="mt-2 text-sm text-slate-400">adityasah841208@gmail.com</p></a>
          <Link href="/login" className="group border border-slate-800 bg-slate-900/70 p-6 transition hover:border-indigo-500"><MessageSquare className="h-6 w-6 text-emerald-400" /><h2 className="mt-5 font-semibold">Account assistance</h2><p className="mt-2 text-sm text-slate-400">Sign in to access your profile and campus workflows.</p></Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
