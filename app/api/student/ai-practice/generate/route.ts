import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AIPracticeQuiz from "@/models/AIPracticeQuiz";
import { generateQuiz, QUIZ_DIFFICULTIES } from "@/lib/ai-practice";

const recentRequests = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const student = await requireRole("STUDENT");
    const body = await req.json();
    const topic = String(body.topic || "").trim();
    const difficulty = String(body.difficulty || "medium") as "easy" | "medium" | "hard";
    if (topic.length < 5 || topic.length > 100) return NextResponse.json({ error: "Enter an academic topic between 5 and 100 characters." }, { status: 400 });
    if (!QUIZ_DIFFICULTIES.includes(difficulty)) return NextResponse.json({ error: "Choose an available difficulty." }, { status: 400 });
    const lastRequest = recentRequests.get(student.id) || 0;
    if (Date.now() - lastRequest < 15000) return NextResponse.json({ error: "Please wait a few seconds before generating another quiz." }, { status: 429 });
    recentRequests.set(student.id, Date.now());
    await connectToDatabase();
    const previous = await AIPracticeQuiz.findOne({ studentId: student.id, topic: new RegExp(`^${topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).sort({ createdAt: -1 }).lean();
    let questions;
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        questions = await generateQuiz(topic, difficulty, previous?.questions.map((question) => question.question) || []);
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!questions) throw lastError instanceof Error ? lastError : new Error("Quiz generation failed.");
    const quiz = await AIPracticeQuiz.create({ studentId: student.id, topic, difficulty, questions, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) });
    return NextResponse.json({ quizId: quiz.id, topic, difficulty, questions: questions.map(({ correctAnswer, ...question }) => question) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "We couldn't generate the quiz right now." }, { status: error.status || 503 });
  }
}
