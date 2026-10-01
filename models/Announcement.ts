import mongoose, { Document, Model, Schema } from "mongoose";
import { AnnouncementAudience, AnnouncementCategory, TelegramDeliveryStatus } from "@/types";

interface IAnnouncementTelegramDelivery {
  destinationId: string;
  status: TelegramDeliveryStatus;
  messageId?: number;
  chatId?: string;
  sentAt?: Date;
  error?: string;
}

export interface IAnnouncement extends Document {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  departmentId: string;
  semesterNumber: number | "ALL";
  authorId: string;
  authorName: string;
  authorRole: "CR" | "FACULTY" | "ADMIN";
  pinned: boolean;
  createdAt: Date;
  telegramBroadcasted: boolean;
  audience?: AnnouncementAudience;
  telegram?: {
    enabled: boolean;
    status: TelegramDeliveryStatus;
    messageId?: number;
    chatId?: string;
    sentAt?: Date;
    error?: string;
    deliveries: IAnnouncementTelegramDelivery[];
  };
}

const TelegramDeliverySchema = new Schema<IAnnouncementTelegramDelivery>({
  destinationId: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "SENT", "FAILED", "DISABLED"], required: true },
  messageId: Number,
  chatId: String,
  sentAt: Date,
  error: String,
}, { _id: false });

const AnnouncementSchema = new Schema<IAnnouncement>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, enum: ["URGENT", "EXAM", "ACADEMIC", "EVENT", "GENERAL"], required: true, index: true },
  departmentId: { type: String, required: true, index: true },
  semesterNumber: { type: Schema.Types.Mixed, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, enum: ["CR", "FACULTY", "ADMIN"], required: true },
  pinned: { type: Boolean, default: false, index: true },
  telegramBroadcasted: { type: Boolean, default: false },
  audience: { type: String, enum: ["ALL_STUDENTS", "DEPARTMENT", "SEMESTER", "BATCH", "SPECIFIC_GROUP"] },
  telegram: {
    enabled: { type: Boolean, default: true },
    status: { type: String, enum: ["PENDING", "SENT", "FAILED", "DISABLED"], default: "PENDING" },
    messageId: Number,
    chatId: String,
    sentAt: Date,
    error: String,
    deliveries: { type: [TelegramDeliverySchema], default: [] },
  },
}, { timestamps: { createdAt: true, updatedAt: false } });

AnnouncementSchema.index({ departmentId: 1, semesterNumber: 1, createdAt: -1 });
AnnouncementSchema.index({ pinned: -1, createdAt: -1 });

export const AnnouncementModel: Model<IAnnouncement> =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

export default AnnouncementModel;
