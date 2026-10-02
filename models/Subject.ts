import mongoose, { Schema, Document, Model } from "mongoose";

export interface IModuleItem {
  id?: string;
  moduleNumber: number;
  title: string;
  description: string;
  topics: string[];
}

export interface ISubject {
  id: string;
  departmentId: string;
  branchCode?: string;
  semesterNumber: number;
  code: string;
  name: string;
  facultyId?: string;
  facultyName?: string;
  credits: number;
  color?: string;
  description: string;
  modulesCount: number;
  references?: string[];
  modules?: IModuleItem[];
  isActive?: boolean;
  syllabusUpdatedAt?: Date;
  syllabusUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleItemSchema = new Schema<IModuleItem>(
  {
    id: { type: String },
    moduleNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    topics: [{ type: String, trim: true }],
  },
  { _id: false }
);

const SubjectSchema = new Schema<ISubject>(
  {
    id: { type: String, required: true, unique: true, index: true },
    departmentId: { type: String, required: true, index: true },
    branchCode: { type: String, trim: true, uppercase: true, index: true },
    semesterNumber: { type: Number, required: true, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    facultyId: { type: String, default: "" },
    facultyName: { type: String, default: "Unassigned", trim: true },
    credits: { type: Number, default: 3 },
    color: { type: String, default: "from-blue-600 to-indigo-600" },
    description: { type: String, default: "" },
    modulesCount: { type: Number, default: 0 },
    references: [{ type: String, trim: true }],
    modules: [ModuleItemSchema],
    isActive: { type: Boolean, default: true },
    syllabusUpdatedAt: { type: Date },
    syllabusUpdatedBy: { type: String, trim: true },
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

export const SubjectModel: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);

export default SubjectModel;
