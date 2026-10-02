import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubmissionFile {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ISimilarityDetail {
  score: number;
  matchedWithSubmissionId: string;
  matchedWithStudentName: string;
  overlappingTokensCount: number;
  matchedPhrases: string[];
}

export type SubmissionStatus = "submitted" | "graded" | "late";

export interface IAssignmentSubmission extends Document {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  submittedAt: Date;
  content: string;
  submissionType: "code" | "pdf" | "document" | "image" | "video" | "text" | "multiple_files";
  files: ISubmissionFile[];
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  status: SubmissionStatus;
  marks?: number;
  maxMarks: number;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: string;
  evaluatedAt?: Date;
  evaluatedBy?: string;
  similarity?: ISimilarityDetail;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionFileSchema = new Schema<ISubmissionFile>(
  {
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const SimilarityDetailSchema = new Schema<ISimilarityDetail>(
  {
    score: { type: Number, required: true },
    matchedWithSubmissionId: { type: String, default: "" },
    matchedWithStudentName: { type: String, default: "" },
    overlappingTokensCount: { type: Number, default: 0 },
    matchedPhrases: [{ type: String }],
  },
  { _id: false }
);

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    id: { type: String, required: true, unique: true, index: true },
    assignmentId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentRoll: { type: String, required: true, trim: true },
    submittedAt: { type: Date, required: true, default: Date.now },
    content: { type: String, required: true },
    submissionType: {
      type: String,
      enum: ["code", "pdf", "document", "image", "video", "text", "multiple_files"],
      default: "code",
    },
    files: [SubmissionFileSchema],
    fileName: { type: String, default: "" },
    fileSize: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["submitted", "graded", "late"],
      default: "submitted",
      index: true,
    },
    marks: { type: Number, min: 0 },
    maxMarks: { type: Number, required: true },
    feedback: { type: String, default: "", trim: true },
    gradedAt: { type: Date },
    gradedBy: { type: String, default: "" },
    evaluatedAt: { type: Date, index: true },
    evaluatedBy: { type: String, default: "" },
    similarity: { type: SimilarityDetailSchema, default: undefined },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// COMPOUND UNIQUE INDEX: Enforce single submission per student per assignment at the database level
AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

// Supporting query indexes
AssignmentSubmissionSchema.index({ assignmentId: 1, status: 1 });
AssignmentSubmissionSchema.index({ studentId: 1, submittedAt: -1 });

export const AssignmentSubmission: Model<IAssignmentSubmission> =
  mongoose.models.AssignmentSubmission ||
  mongoose.model<IAssignmentSubmission>("AssignmentSubmission", AssignmentSubmissionSchema);

export default AssignmentSubmission;
