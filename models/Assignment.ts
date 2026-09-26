import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAssignment extends Document {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  moduleId: string;
  moduleTitle: string;
  departmentId: string;
  semesterNumber: number;
  facultyId: string;
  facultyName: string;
  totalMarks: number;
  deadline: Date;
  allowLate: boolean;
  instructions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    subjectId: { type: String, required: true, index: true },
    subjectCode: { type: String, required: true },
    subjectName: { type: String, required: true },
    moduleId: { type: String, required: true, index: true },
    moduleTitle: { type: String, required: true },
    departmentId: { type: String, required: true, index: true },
    semesterNumber: { type: Number, required: true, index: true },
    facultyId: { type: String, required: true, index: true },
    facultyName: { type: String, required: true },
    totalMarks: { type: Number, required: true, min: 1 },
    deadline: { type: Date, required: true, index: true },
    allowLate: { type: Boolean, default: false },
    instructions: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Assignment: Model<IAssignment> =
  mongoose.models.Assignment || mongoose.model<IAssignment>("Assignment", AssignmentSchema);

export default Assignment;
