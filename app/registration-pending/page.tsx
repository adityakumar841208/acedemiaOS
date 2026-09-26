import Link from "next/link";
import PublicFooter from "@/components/layout/PublicFooter";

export default function RegistrationPendingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4">
      <section className="max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-bold">Registration submitted successfully.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Your account is awaiting verification by a Faculty member, CR, or Admin. Once approved, your department-generated Portal Roll No. will be available in your profile.
        </p>
        <Link href="/login" className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500">
          Continue to login
        </Link>
      </section>
      <div className="mt-12 w-full"><PublicFooter /></div>
    </main>
  );
}