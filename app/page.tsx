"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, BookOpen, Check, GraduationCap, Hexagon, LockKeyhole, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import PublicFooter from "@/components/layout/PublicFooter";
import { HexagonPattern } from "@/components/ui/hexagon-pattern";

const workflows = [
  { number: "01", title: "Organize coursework", copy: "Subjects, modules, resources, and assignments stay tied to the academic hierarchy." },
  { number: "02", title: "Run the day", copy: "Attendance, announcements, and deadlines give every role the same source of truth." },
  { number: "03", title: "Review with context", copy: "Submission history, grades, and similarity signals stay attached to the work." },
];

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.main
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.55, ease: "easeOut" }}
      className="min-h-screen overflow-hidden bg-[#090b10] text-slate-100 selection:bg-amber-300 selection:text-slate-950"
    >
      <div
        className="
    pointer-events-none
    fixed inset-0
    opacity-25
    mask-[radial-gradient(ellipse_at_center,black_0%,black_45%,transparent_80%)]
    [-webkit-mask-image:radial-gradient(ellipse_at_center,black_0%,black_45%,transparent_80%)]
  "
      >
        <HexagonPattern className="h-full w-full" />
      </div>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(245,158,11,0.08),transparent_28%),linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.025)_48%,transparent_48.2%)]" />
      <header className="relative z-10 border-b border-white/10"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/" className="flex items-center gap-3" aria-label="AcademiaOS home"><span className="flex h-12 w-12 items-center justify-center text-slate-950"><Image
        src="/logo.png"
        alt="Logo"
        width={60}
        height={60}
        className="w-full h-full object-cover rounded"
      /></span><span className="text-sm font-bold tracking-[0.16em] text-white">ACADEMIA<span className="text-amber-300">OS</span></span></Link><div className="flex items-center gap-5 text-xs font-semibold"><Link href="/about" className="hidden text-slate-400 transition-colors hover:text-white sm:block">About</Link><Link href="/contact" className="hidden text-slate-400 transition-colors hover:text-white sm:block">Contact</Link><Link href="/login" className="inline-flex items-center gap-2 border border-white/15 px-3.5 py-2 text-white transition-colors hover:border-amber-300/60 hover:text-amber-200"><LogIn className="h-3.5 w-3.5" /> Sign in</Link></div></div></header>
      <section className="relative z-10 mx-auto grid min-h-155 max-w-7xl items-center gap-14 px-5 py-18 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-24"><div className="max-w-3xl"><div className="mb-7 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300"><span className="h-px w-8 bg-amber-300" /> Academic operations, in one place</div><h1 className="max-w-3xl text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">The campus day, made <span className="text-amber-300">legible.</span></h1><p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">AcademiaOS gives students, faculty, and administrators one dependable place for the work between lectures: coursework, resources, attendance, and communication.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/login" className="inline-flex items-center gap-2 bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"><span>Enter the workspace</span><ArrowUpRight className="h-4 w-4" /></Link><Link href="/register" className="inline-flex items-center gap-2 border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-white/35"><UserPlus className="h-4 w-4" /> Register as a student</Link></div><div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Role-based access</span><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-amber-300" /> Server-enforced records</span><span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-sky-300" /> Structured by subject</span></div></div><aside className="relative border-l border-amber-300/40 pl-6 sm:pl-8"><div className="mb-10 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500"><span>Workspace index</span><span className="text-emerald-400">● operational</span></div><div>{["Dashboard", "Coursework", "Attendance", "Resource vault", "Announcements"].map((item, index) => <div key={item} className="group flex items-center justify-between border-t border-white/10 py-4 text-sm text-slate-400 transition-colors hover:text-white"><span className="flex items-center gap-3"><span className={`h-1.5 w-1.5 ${true ? "bg-amber-300" : "bg-slate-600"}`} />{item}</span><span className="font-mono text-[10px] text-slate-600">0{index + 1}</span></div>)}</div><div className="mt-9 flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-slate-500"><Hexagon className="h-4 w-4 text-amber-300" /><span>Built around the way your institution already works.</span></div></aside></section>
      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
        className="relative isolate overflow-hidden border-y border-white/[0.08] border-b-0 bg-[#0b0f17]"
      >
        {/* Hexagon background */}
        <div
          className="
      pointer-events-none absolute inset-0
      opacity-[0.12]
      [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_85%)]
      [-webkit-mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_85%)]
    "
        >
          <HexagonPattern className="h-full w-full" />
        </div>

        {/* Ambient glows */}
        <div
          className="
      pointer-events-none absolute
      left-1/2 top-0
      h-[400px] w-[700px]
      -translate-x-1/2
      rounded-full
      bg-amber-500/[0.06]
      blur-[120px]
    "
        />

        <div
          className="
      pointer-events-none absolute
      -right-32 bottom-0
      h-72 w-72
      rounded-full
      bg-indigo-500/[0.05]
      blur-[100px]
    "
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 border-b-0">
          {/* Section heading */}
          <div className="flex flex-col gap-4 border-b-0 border-white/[0.07] py-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px w-7 bg-amber-400" />

                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
                  How AcademiaOS works
                </span>
              </div>

              <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Everything students need,
                <span className="text-slate-500"> in one academic workspace.</span>
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-6 text-slate-500">
              A connected workflow for learning, resources, assignments and
              academic collaboration.
            </p>
          </div>

          {/* Workflow */}
          <div className="relative grid gap-4 md:grid-cols-3 md:gap-5">
            {workflows.map((workflow, index) => (
              <motion.article
                key={workflow.number}
                className="group relative"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
                style={{
                  animationDelay: `${index * 120}ms`,
                }}
              >
                {/* Vertical fade */}
                <div
                  className="
          [mask-image:linear-gradient(to_bottom,black_0%,black_42%,transparent_100%)]
          [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_42%,transparent_100%)]
        "
                >
                  {/* Animated border */}
                  <div className="relative overflow-hidden rounded-[26px] p-px">
                    {/* Moving border */}
                    <div
                      className="
              absolute inset-[-100%]
              animate-[workflowBorder_8s_linear_infinite]
              bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(251,191,36,0.04)_320deg,rgba(251,191,36,0.75)_340deg,rgba(255,255,255,0.9)_350deg,rgba(251,191,36,0.06)_360deg)]
              opacity-60
              transition-opacity
              duration-700
              group-hover:opacity-100
            "
                      style={{
                        animationDelay: `${index * -1.5}s`,
                      }}
                    />

                    {/* Static border */}
                    <div
                      className="
              absolute inset-0
              rounded-[26px]
              border border-white/[0.08]
            "
                    />

                    {/* Card */}
                    <div
                      className="
    relative
    min-h-[330px]
    overflow-hidden
    rounded-[25px]
    bg-[#0b0f17]
    px-6 py-7
    md:px-7 md:py-8
  "
                    >
                      {/* Top glow */}
                      <div
                        className="
      pointer-events-none
      absolute -right-20 -top-20
      h-52 w-52
      rounded-full
      bg-amber-400/[0.07]
      opacity-0
      blur-3xl
      transition-opacity
      duration-700
      group-hover:opacity-100
    "
                      />

                      {/* Bottom glow */}
                      <div
                        className="
      pointer-events-none
      absolute -bottom-24 left-1/2
      h-40 w-40
      -translate-x-1/2
      rounded-full
      bg-indigo-500/[0.04]
      opacity-0
      blur-3xl
      transition-opacity
      duration-700
      group-hover:opacity-100
    "
                      />

                      <div className="relative z-10">
                        {/* Number + Arrow */}
                        <div className="mb-10 flex items-center justify-between">
                          {/* Number */}
                          <div className="relative">
                            <div
                              className="
            relative z-10
            flex h-11 w-11
            items-center justify-center
            rounded-full
            border border-white/10
            bg-[#0d1119]
            text-[11px]
            font-bold
            tracking-wider
            text-amber-300
            shadow-[0_0_0_4px_rgba(255,255,255,0.01)]
            transition-all duration-500
            group-hover:border-amber-400/50
            group-hover:bg-amber-400
            group-hover:text-slate-950
            group-hover:shadow-[0_0_30px_rgba(251,191,36,0.18)]
          "
                            >
                              {workflow.number}
                            </div>

                            {/* Pulse */}
                            <span
                              className="
            pointer-events-none
            absolute inset-0
            rounded-full
            border border-amber-400/30
            opacity-0
            transition-all duration-700
            group-hover:scale-[1.6]
            group-hover:opacity-100
          "
                            />
                          </div>

                          {/* Arrow */}
                          <div
                            className="
          flex h-9 w-9
          items-center justify-center
          rounded-full
          border border-white/10
          bg-white/[0.025]
          text-slate-600
          transition-all duration-500
          group-hover:-translate-y-1
          group-hover:translate-x-1
          group-hover:border-amber-400/30
          group-hover:bg-amber-400/10
          group-hover:text-amber-300
        "
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                        </div>

                        {/* Large number */}
                        <span
                          className="
        pointer-events-none
        absolute right-0 top-10
        select-none
        text-[110px]
        font-black
        leading-none
        tracking-[-0.08em]
        text-white/2.5
        transition-colors duration-700
        group-hover:text-amber-300/[0.06]
      "
                        >
                          {workflow.number}
                        </span>

                        {/* Content */}
                        <div className="relative">
                          <h3
                            className="
          max-w-70
          text-xl
          font-semibold
          tracking-tight
          text-white
          transition-colors duration-500
          group-hover:text-amber-50
        "
                          >
                            {workflow.title}
                          </h3>

                          <p
                            className="
          mt-3
          max-w-sm
          text-sm
          leading-6
          text-slate-500
          transition-colors duration-500
          group-hover:text-slate-400
        "
                          >
                            {workflow.copy}
                          </p>

                          {/* Feature indicator */}
                          <div
                            className="
          mt-8
          flex items-center gap-2
          text-[10px]
          font-bold
          uppercase
          tracking-[0.18em]
          text-slate-600
          transition-colors duration-500
          group-hover:text-amber-300
        "
                          >
                            <span
                              className="
            h-px w-5
            bg-current
            transition-all duration-500
            group-hover:w-8
          "
                            />

                            Built into AcademiaOS
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>


      </motion.section>
      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
        className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-28"
      ><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Access by responsibility</p><h2 className="mt-4 max-w-sm text-3xl font-bold leading-tight tracking-[-0.03em] text-white">The right view for the work in front of you.</h2></div><div className="grid gap-4 sm:grid-cols-3">{[{ title: "Students", copy: "Keep coursework, attendance, and feedback close.", action: "Student sign in" }, { title: "Faculty", copy: "Teach, mark, review, and manage the class day.", action: "Faculty sign in" }, { title: "Administrators", copy: "Maintain the system behind the academic work.", action: "Admin sign in" }].map((role) => <Link key={role.title} href="/login" className="group border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-amber-300/50 hover:bg-white/[0.06]"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">{role.title}</span><ArrowUpRight className="h-4 w-4 text-slate-600 transition-colors group-hover:text-amber-300" /></div><p className="mt-8 text-xs leading-5 text-slate-500">{role.copy}</p><span className="mt-6 block text-[11px] font-bold uppercase tracking-wider text-amber-300">{role.action}</span></Link>)}</div></motion.section>
      <footer className="relative z-10 border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>AcademiaOS · Academic operations for real classrooms.</span><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Designed for the daily record</span></div></footer>
      <PublicFooter />
    </motion.main>
  );
}
