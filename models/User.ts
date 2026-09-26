import mongoose, { Schema, Document, Model } from "mongoose";

export type RoleType = "STUDENT" | "CR" | "FACULTY" | "ADMIN";
export type StatusType = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: RoleType;
  status: StatusType;
  department: string;
  semester?: number;
  rollNumber?: string;
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
      required: [true, "Department is required"],
      default: "CSE",
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: 3,
    },
    rollNumber: {
      type: String,
      trim: true,
      default: "",
      sparse: true,
      unique: true,
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

