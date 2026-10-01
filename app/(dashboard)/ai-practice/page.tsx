"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BrainCircuit, Check, ChevronLeft, ChevronRight, Clock3, RotateCcw, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useUserSession } from "@/context/UserContext";

type Question = { id: number; question: string; options: string[] };
type Result = Question & { correctAnswer: number; selectedAnswer: number; explanation: string; isCorrect: boolean };
type Difficulty = "easy" | "medium" | "hard";

export default function AIPracticePage() {
  const { isStudent } = useUserSession();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [quizId, setQuizId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<Result[]>([]);
  const [current, setCurrent] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => { fetch("/api/student/ai-practice").then((response) => response.ok ? response.json() : null).then((data) => data && setHistory(data.history || [])); }, []);

  const generate = async () => {
    if (topic.trim().length < 5) { toast.error("Enter an academic topic with at least five characters."); return; }
    setGenerating(true); setResults([]); setAnswers({}); setCurrent(0);
    try {
      const response = await fetch("/api/student/ai-practice/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, difficulty }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to generate a quiz.");
      setQuizId(data.quizId); setQuestions(data.questions || []);
    } catch (error: any) { toast.error(error.message || "We couldn't generate the quiz right now."); }
    finally { setGenerating(false); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/student/ai-practice/${quizId}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit the quiz.");
      setResults(data.results); setConfirmSubmit(false); setHistory((currentHistory) => [{ topic, difficulty, score: data.score, submittedAt: new Date().toISOString() }, ...currentHistory]);
    } catch (error: any) { toast.error(error.message || "Unable to submit the quiz."); }
    finally { setSubmitting(false); }
  };

  const answered = Object.keys(answers).length;
  const currentQuestion = questions[current];
  const score = useMemo(() => results.filter((result) => result.isCorrect).length, [results]);

  if (!isStudent) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-800">AI Practice is available to students only.</div>;

  return <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-200">
    <header className="flex items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><BrainCircuit className="h-4 w-4" /> Student practice</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">AI Practice</h1><p className="mt-1 text-sm text-slate-500">Generate a fresh ten-question quiz for any academic topic.</p></div><Link href="/dashboard" className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 sm:flex"><ArrowLeft className="h-4 w-4" /> Dashboard</Link></header>
    {questions.length === 0 && results.length === 0 ? <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Sparkles className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-slate-900">What do you want to practice?</h2><p className="mt-1 text-sm text-slate-500">Questions are generated for this session and evaluated on the server.</p></div></div><label className="mt-8 block text-xs font-semibold text-slate-700">Topic<input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={100} placeholder="e.g. Binary search edge cases" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" /></label><fieldset className="mt-6"><legend className="text-xs font-semibold text-slate-700">Difficulty</legend><div className="mt-2 flex flex-wrap gap-2">{(["easy", "medium", "hard"] as Difficulty[]).map((value) => <label key={value} className={`cursor-pointer rounded-lg border px-4 py-2 text-xs font-semibold capitalize ${difficulty === value ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-600"}`}><input type="radio" name="difficulty" value={value} checked={difficulty === value} onChange={() => setDifficulty(value)} className="sr-only" />{value}</label>)}</div></fieldset><button type="button" disabled={generating} onClick={generate} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">{generating ? <><Clock3 className="h-4 w-4 animate-pulse" /> Creating your quiz…</> : <><Sparkles className="h-4 w-4" /> Generate 10 questions</>}</button>{generating && <p className="mt-3 text-xs text-slate-500">Checking the topic, generating questions, and validating the answer set.</p>}</div><aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Try a topic</h2><div className="mt-3 flex flex-wrap gap-2">{["Binary Search", "DBMS Normalization", "Process Scheduling", "Java OOP", "Probability", "Deadlocks"].map((example) => <button key={example} type="button" onClick={() => setTopic(example)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-700">{example}</button>)}</div></aside></section> : results.length === 0 ? <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{topic} · {difficulty}</p><h2 className="mt-1 text-xl font-bold text-slate-900">Question {current + 1} of {questions.length}</h2></div><span className="text-xs font-semibold text-slate-500">{answered}/10 answered</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div><div className="mt-8"><p className="text-lg font-semibold leading-7 text-slate-900">{currentQuestion.question}</p><div className="mt-6 space-y-3">{currentQuestion.options.map((option, index) => <button type="button" key={option} onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion.id]: index }))} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm ${answers[currentQuestion.id] === index ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-200 text-slate-700 hover:border-indigo-300"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${answers[currentQuestion.id] === index ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"}`}>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></div><div className="mt-8 flex justify-between gap-3 border-t border-slate-100 pt-5"><button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Previous</button>{current === questions.length - 1 ? <button type="button" onClick={() => answered === questions.length ? setConfirmSubmit(true) : toast.error("Please answer all 10 questions before submitting.")} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Submit quiz</button> : <button type="button" onClick={() => setCurrent((value) => value + 1)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Next <ChevronRight className="h-4 w-4" /></button>}</div></section> : <section className="space-y-5"><div className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8"><p className="text-xs uppercase tracking-wider text-indigo-300">Quiz complete</p><h2 className="mt-2 text-3xl font-bold">{topic}</h2><div className="mt-6 flex flex-wrap items-end gap-8"><div><p className="text-xs text-slate-400">Score</p><p className="text-4xl font-bold">{score}/10</p></div><div><p className="text-xs text-slate-400">Percentage</p><p className="text-3xl font-bold">{score * 10}%</p></div><button type="button" onClick={() => { setQuestions([]); setResults([]); setAnswers({}); }} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20"><RotateCcw className="h-4 w-4" /> Practice again</button></div></div><div className="space-y-4">{results.map((result, index) => <article key={result.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${result.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{result.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}</span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Question {index + 1}</p><h3 className="mt-1 font-semibold text-slate-900">{result.question}</h3><p className="mt-3 text-xs text-slate-600"><strong>Your answer:</strong> {result.options[result.selectedAnswer]}</p>{!result.isCorrect && <p className="mt-1 text-xs font-semibold text-emerald-700"><strong>Correct answer:</strong> {result.options[result.correctAnswer]}</p>}<p className="mt-3 border-l-2 border-indigo-200 pl-3 text-sm leading-6 text-slate-600">{result.explanation}</p></div></div></article>)}</div></section>}
    {history.length > 0 && questions.length === 0 && results.length === 0 && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-semibold text-slate-900"><Clock3 className="h-4 w-4 text-slate-400" /> Recent practice</h2><div className="mt-3 grid gap-2 sm:grid-cols-3">{history.slice(0, 6).map((item, index) => <div key={`${item.topic}-${item.submittedAt}-${index}`} className="rounded-xl bg-slate-50 px-3 py-3 text-xs"><p className="font-semibold text-slate-800">{item.topic}</p><p className="mt-1 text-slate-500">{item.difficulty} · {item.score}/10</p></div>)}</div></section>}
    {confirmSubmit && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold text-slate-900">Submit quiz?</h2><p className="mt-2 text-sm text-slate-500">You have answered {answered} of {questions.length} questions. Your answers will be scored on the server.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmSubmit(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Continue quiz</button><button type="button" disabled={submitting} onClick={submit} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{submitting ? "Submitting…" : "Submit"}</button></div></div></div>}
  </div>;
}
