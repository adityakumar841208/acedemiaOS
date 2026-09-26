import mongoose, { Document, Model, Schema } from "mongoose";

export interface IResource extends Document {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  departmentId: string;
  semesterNumber: number;
  category: "NOTES" | "PPT" | "PYQ" | "VIDEO" | "SYLLABUS";
  fileUrl: string;
  fileSize: string;
  fileType: "pdf" | "pptx" | "mp4" | "doc";
  uploadedBy: { id: string; name: string; role: string };
  downloadCount: number;
  isVerified: boolean;
  contentSnippet?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    subjectId: { type: String, required: true, index: true },
    subjectCode: { type: String, required: true },
    subjectName: { type: String, required: true },
    moduleId: { type: String, required: true, index: true },
    moduleNumber: { type: Number, required: true },
    moduleTitle: { type: String, required: true },
    departmentId: { type: String, required: true, index: true },
    semesterNumber: { type: Number, required: true, index: true },
    category: { type: String, enum: ["NOTES", "PPT", "PYQ", "VIDEO", "SYLLABUS"], required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "pptx", "mp4", "doc"], required: true },
    uploadedBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    downloadCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    contentSnippet: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Resource: Model<IResource> =
  mongoose.models.Resource || mongoose.model<IResource>("Resource", ResourceSchema);

export default Resource;
