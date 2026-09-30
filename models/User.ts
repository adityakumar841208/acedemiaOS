import mongoose, { Schema, Document, Model } from "mongoose";

export type RoleType = "STUDENT" | "CR" | "FACULTY" | "ADMIN";
export type StatusType = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export interface IFacultyProfile {
  designation?: string;
  title?: string;
  officeLocation?: string;
  phone?: string;
  bio?: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: RoleType;
  status: StatusType;
  department: string;
  branchId?: mongoose.Types.ObjectId;
  branchIds?: mongoose.Types.ObjectId[];
  semester?: number;
  rollNumber?: string;
  facultyProfile?: IFacultyProfile;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FacultyProfileSchema = new Schema<IFacultyProfile>(
  {
    designation: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Assistant Professor",
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Assistant Professor",
    },
    officeLocation: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 25,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // Prevents accidental exposure in queries unless explicitly selected (+passwordHash)
    },
    role: {
      type: String,
      enum: ["STUDENT", "CR", "FACULTY", "ADMIN"],
      default: "STUDENT",
      index: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
      required: true,
    },
    department: {
      type: String,
      default: "CSE",
      trim: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      index: true,
    },
    branchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Branch",
        index: true,
      },
    ],
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    rollNumber: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    facultyProfile: {
      type: FacultyProfileSchema,
      default: undefined,
    },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Prevent mongoose OverwriteModelError in Next.js hot reload
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
