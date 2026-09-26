import Link from "next/link";
import { ArrowRight, FolderTree, LockKeyhole, ShieldCheck } from "lucide-react";
import PublicFooter from "@/components/layout/PublicFooter";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800/80 bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/" className="font-bold">Academia<span className="text-indigo-400">OS</span></Link><Link href="/login" className="text-sm font-semibold text-indigo-300 hover:text-white">Open portal <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">The academic operating layer</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Less hunting. More learning.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">AcademiaOS gives departments one dependable place to manage academic material, announcements, assignments, and student access without stitching together disconnected tools.</p>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <div className="border-t border-indigo-500 pt-5"><FolderTree className="h-6 w-6 text-indigo-400" /><h2 className="mt-4 font-semibold">Clear hierarchy</h2><p className="mt-2 text-sm leading-6 text-slate-400">Resources follow the way a campus thinks: department, semester, subject, module, then resource.</p></div>
          <div className="border-t border-rose-500 pt-5"><LockKeyhole className="h-6 w-6 text-rose-400" /><h2 className="mt-4 font-semibold">Rules that hold</h2><p className="mt-2 text-sm leading-6 text-slate-400">Deadlines and role permissions are enforced on the server, not just suggested by the interface.</p></div>
          <div className="border-t border-amber-500 pt-5"><ShieldCheck className="h-6 w-6 text-amber-400" /><h2 className="mt-4 font-semibold">Built for trust</h2><p className="mt-2 text-sm leading-6 text-slate-400">Private sessions, scoped approvals, and similarity checks keep everyday academic work accountable.</p></div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
