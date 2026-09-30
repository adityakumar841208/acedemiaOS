import mongoose, { Schema, Document, Model } from "mongoose";

export type BranchStatus = "ACTIVE" | "INACTIVE";

export interface IBranch {
  name: string;
  code: string;
  description?: string;
  hodName?: string;
  status: BranchStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBranchDocument extends IBranch, Document {
  _id: mongoose.Types.ObjectId;
}

const BranchSchema = new Schema<IBranchDocument>(
  {
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
      minlength: [2, "Branch name must be at least 2 characters"],
      maxlength: [100, "Branch name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Branch code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, "Branch code must be at least 2 characters"],
      maxlength: [12, "Branch code cannot exceed 12 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    hodName: {
      type: String,
      trim: true,
      maxlength: [80, "HOD name cannot exceed 80 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
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

// Synchronize status and isActive before saving
BranchSchema.pre("save", function (this: IBranchDocument) {
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }
  if (this.status) {
    this.isActive = this.status === "ACTIVE";
  } else if (this.isActive !== undefined) {
    this.status = this.isActive ? "ACTIVE" : "INACTIVE";
  }
});

export const Branch: Model<IBranchDocument> =
  mongoose.models.Branch || mongoose.model<IBranchDocument>("Branch", BranchSchema);

export default Branch;
