import mongoose, { Document, Model, Schema } from "mongoose";

export type QuizDifficulty = "easy" | "medium" | "hard";

export interface IQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface IAIPracticeQuiz extends Document {
  studentId: string;
  topic: string;
  difficulty: QuizDifficulty;
  questions: IQuizQuestion[];
  answers?: Record<string, number>;
  score?: number;
  submittedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuizQuestion>({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true, validate: (value: string[]) => value.length === 4 },
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, required: true },
}, { _id: false });

const QuizSchema = new Schema<IAIPracticeQuiz>({
  studentId: { type: String, required: true, index: true },
  topic: { type: String, required: true, trim: true, maxlength: 100 },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  questions: { type: [QuestionSchema], required: true },
  answers: { type: Schema.Types.Mixed },
  score: { type: Number, min: 0, max: 10 },
  submittedAt: Date,
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

QuizSchema.index({ studentId: 1, createdAt: -1 });
QuizSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AIPracticeQuiz: Model<IAIPracticeQuiz> = mongoose.models.AIPracticeQuiz || mongoose.model<IAIPracticeQuiz>("AIPracticeQuiz", QuizSchema);
export default AIPracticeQuiz;
