import Link from "next/link";
import { GraduationCap, Mail } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600"><GraduationCap className="h-4 w-4" /></span>
            Academia<span className="text-indigo-400">OS</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6">A focused academic workspace for courses, resources, announcements, and deadline-aware submissions.</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Explore</h2>
          <div className="mt-4 grid gap-3 text-sm"><Link href="/about" className="hover:text-white">About AcademiaOS</Link><Link href="/contact" className="hover:text-white">Contact support</Link><Link href="/register" className="hover:text-white">Create an account</Link></div>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Need help?</h2>
          <a href="mailto:adityasah841208@gmail.com" className="mt-4 inline-flex items-center gap-2 text-sm hover:text-white"><Mail className="h-4 w-4 text-indigo-400" />Email the portal team</a>
        </div>
      </div>
      <div className="border-t border-slate-800/80 px-4 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} AcademiaOS. Built for better campus workflows.</div>
    </footer>
  );
}
