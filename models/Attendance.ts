import mongoose, { Document, Model, Schema } from "mongoose";

export type AttendanceStatus = "present" | "absent";

export interface IAttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

export interface IAttendance extends Document {
  subjectId: string;
  facultyId: string;
  branchId?: string;
  branchCode: string;
  semesterNumber: number;
  date: Date;
  records: IAttendanceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId: { type: String, required: true },
    status: { type: String, enum: ["present", "absent"], required: true },
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendance>(
  {
    subjectId: { type: String, required: true, index: true },
    facultyId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    branchCode: { type: String, required: true, index: true },
    semesterNumber: { type: Number, required: true, index: true },
    date: { type: Date, required: true, index: true },
    records: { type: [AttendanceRecordSchema], default: [] },
  },
  { timestamps: true }
);

AttendanceSchema.index({ subjectId: 1, branchCode: 1, semesterNumber: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ "records.studentId": 1, date: -1 });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
