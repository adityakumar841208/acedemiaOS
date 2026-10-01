import { QuizDifficulty } from "@/models/AIPracticeQuiz";

export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ["easy", "medium", "hard"];

export function validateQuizPayload(value: unknown) {
  const payload = value as { questions?: unknown[] };
  if (!payload || !Array.isArray(payload.questions) || payload.questions.length !== 10) throw new Error("The generated quiz did not contain exactly 10 questions.");
  const questions = payload.questions.map((question: any, index) => {
    if (!question || typeof question.question !== "string" || !question.question.trim() || !Array.isArray(question.options) || question.options.length !== 4 || typeof question.explanation !== "string" || !question.explanation.trim()) throw new Error(`Question ${index + 1} is incomplete.`);
    const options: string[] = question.options.map((option: unknown) => String(option).trim());
    if (options.some((option) => !option) || new Set(options.map((option) => option.toLowerCase())).size !== 4) throw new Error(`Question ${index + 1} contains duplicate or empty options.`);
    const correctAnswer = typeof question.correctAnswer === "number"
      ? question.correctAnswer
      : options.findIndex((option) => option.toLowerCase() === String(question.correctAnswer).trim().toLowerCase());
    if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) throw new Error(`Question ${index + 1} has an invalid answer key.`);
    return { id: index + 1, question: question.question.trim(), options, correctAnswer, explanation: question.explanation.trim() };
  });
  if (new Set(questions.map((question) => question.question.toLowerCase())).size !== 10) throw new Error("The generated quiz contains duplicate questions.");
  return questions;
}

export async function generateQuiz(topic: string, difficulty: QuizDifficulty, avoidQuestions: string[] = []) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("AI practice is not configured.");
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const prompt = `You are an academic quiz generator. Generate exactly 10 high-quality multiple-choice questions about the topic below.
Topic: ${topic}
Difficulty: ${difficulty}
${avoidQuestions.length ? `Do not repeat or closely paraphrase these previous question stems: ${avoidQuestions.slice(0, 10).join(" | ")}` : ""}
Requirements: cover different concepts, avoid ambiguity and duplicates, use exactly four unique options per question, use exactly one correct answer, and include a concise factual explanation. Return only a JSON object with this shape: {"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":0,"explanation":"..."}]}. correctAnswer is a zero-based option index. Do not include markdown.`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.45, max_tokens: 5000, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Return valid JSON only." }, { role: "user", content: prompt }] }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const providerError = await response.text();
      console.error("[AI Practice] Groq request failed", { status: response.status, model, providerError: providerError.slice(0, 500) });
      throw new Error(`Groq request failed with status ${response.status}.`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("The AI provider returned an empty quiz.");
    return validateQuizPayload(JSON.parse(content));
  } finally {
    clearTimeout(timeout);
  }
}
