import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Chat" },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
