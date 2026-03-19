import mongoose, { Schema, Document } from "mongoose";

export interface ISkill extends Document {
  name: string;
  category: string;
  aliases: string[];
}

const skillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    aliases: [{ type: String }],
  },
  { timestamps: true }
);

export const Skill = mongoose.model<ISkill>("Skill", skillSchema);
