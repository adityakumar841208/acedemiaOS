import mongoose, { Schema, Document, Model } from "mongoose";

export type FacultySubjectStatus = "ACTIVE" | "REVOKED";

export interface IFacultySubject extends Document {
  id: string;
  facultyId: string;
  facultyName: string;
  facultyEmail: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  departmentId: string;
  branchId?: mongoose.Types.ObjectId;
  branchCode: string;
  semesterNumber: number;
  status: FacultySubjectStatus;
  assignedBy: string;
  assignedAt: Date;
  revokedBy?: string;
  revokedAt?: Date;
  revocationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FacultySubjectSchema = new Schema<IFacultySubject>(
  {
    id: { type: String, required: true, unique: true, index: true },
    facultyId: { type: String, required: true, index: true },
    facultyName: { type: String, required: true, trim: true },
    facultyEmail: { type: String, default: "", trim: true },
    subjectId: { type: String, required: true, index: true },
    subjectCode: { type: String, required: true, trim: true },
    subjectName: { type: String, required: true, trim: true },
    departmentId: { type: String, required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    branchCode: { type: String, required: true, trim: true, uppercase: true },
    semesterNumber: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED"],
      default: "ACTIVE",
      index: true,
      required: true,
    },
    assignedBy: { type: String, required: true, trim: true },
    assignedAt: { type: Date, required: true, default: Date.now },
    revokedBy: { type: String, default: "", trim: true },
    revokedAt: { type: Date },
    revocationReason: { type: String, default: "", trim: true },
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

// COMPOUND UNIQUE INDEX: A faculty member cannot receive the exact same active subject assignment twice
FacultySubjectSchema.index(
  { facultyId: 1, subjectId: 1, departmentId: 1, semesterNumber: 1, status: 1 },
  { unique: true }
);

// Supporting query indexes
FacultySubjectSchema.index({ facultyId: 1, status: 1 });
FacultySubjectSchema.index({ subjectId: 1, status: 1 });
FacultySubjectSchema.index({ departmentId: 1, semesterNumber: 1, status: 1 });

export const FacultySubject: Model<IFacultySubject> =
  mongoose.models.FacultySubject ||
  mongoose.model<IFacultySubject>("FacultySubject", FacultySubjectSchema);

export default FacultySubject;
