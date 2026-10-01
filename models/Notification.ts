import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType = "assignment" | "announcement" | "grade" | "resource" | "doubt" | "system";

export interface INotification extends Document {
  userId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, index: true },
    targetRole: { type: String, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    type: { type: String, enum: ["assignment", "announcement", "grade", "resource", "doubt", "system"], required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
