import mongoose, { Document, Model, Schema } from "mongoose";

export type DoubtStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type DoubtSenderRole = "student" | "faculty";

export interface IDoubtAttachment {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface IDoubtMessage {
  senderId: string;
  senderRole: DoubtSenderRole;
  message: string;
  attachments: IDoubtAttachment[];
  createdAt: Date;
}

export interface IDoubt extends Document {
  studentId: string;
  facultyId: string;
  subjectId: string;
  title: string;
  description: string;
  status: DoubtStatus;
  activeStudentKey?: string;
  messages: IDoubtMessage[];
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IDoubtAttachment>({
  url: { type: String, required: true },
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
}, { _id: false });

const MessageSchema = new Schema<IDoubtMessage>({
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ["student", "faculty"], required: true },
  message: { type: String, required: true, maxlength: 5000 },
  attachments: { type: [AttachmentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const DoubtSchema = new Schema<IDoubt>({
  studentId: { type: String, required: true, index: true },
  facultyId: { type: String, required: true, index: true },
  subjectId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED"], default: "OPEN", index: true },
  activeStudentKey: { type: String, sparse: true, unique: true, index: true },
  messages: { type: [MessageSchema], default: [] },
  resolvedAt: Date,
  resolvedBy: String,
}, { timestamps: true });

DoubtSchema.index({ facultyId: 1, status: 1, updatedAt: -1 });
DoubtSchema.index({ studentId: 1, createdAt: -1 });

export const Doubt: Model<IDoubt> = mongoose.models.Doubt || mongoose.model<IDoubt>("Doubt", DoubtSchema);
export default Doubt;
