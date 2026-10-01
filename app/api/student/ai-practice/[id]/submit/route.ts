import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AIPracticeQuiz from "@/models/AIPracticeQuiz";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const student = await requireRole("STUDENT");
    const { id } = await params;
    const body = await req.json();
    const answers = body.answers;
    if (!answers || typeof answers !== "object") return NextResponse.json({ error: "Quiz answers are required." }, { status: 400 });
    await connectToDatabase();
    const quiz = await AIPracticeQuiz.findOne({ _id: id, studentId: student.id });
    if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
    if (quiz.submittedAt) return NextResponse.json({ error: "This quiz has already been submitted." }, { status: 409 });
    const normalizedAnswers: Record<string, number> = {};
    let score = 0;
    quiz.questions.forEach((question) => {
      const answer = Number(answers[String(question.id)]);
      if (!Number.isInteger(answer) || answer < 0 || answer > 3) return;
      normalizedAnswers[String(question.id)] = answer;
      if (answer === question.correctAnswer) score += 1;
    });
    if (Object.keys(normalizedAnswers).length !== quiz.questions.length) return NextResponse.json({ error: "Please answer all 10 questions before submitting." }, { status: 400 });
    quiz.answers = normalizedAnswers;
    quiz.score = score;
    quiz.submittedAt = new Date();
    await quiz.save();
    return NextResponse.json({ score, total: quiz.questions.length, percentage: score * 10, results: quiz.questions.map((question) => ({ id: question.id, question: question.question, options: question.options, correctAnswer: question.correctAnswer, explanation: question.explanation, selectedAnswer: normalizedAnswers[String(question.id)], isCorrect: normalizedAnswers[String(question.id)] === question.correctAnswer })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to submit the quiz." }, { status: error.status || 500 });
  }
}
