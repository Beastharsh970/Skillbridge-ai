import mongoose, { Schema, Document } from "mongoose";

export interface IRoleSkill {
  name: string;
  priority: "essential" | "important" | "nice-to-have";
  category: string;
}

export interface IRole extends Document {
  title: string;
  slug: string;
  description: string;
  requiredSkills: IRoleSkill[];
  averageSalary?: string;
  demandLevel: "high" | "medium" | "low";
  createdAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    requiredSkills: [
      {
        name: { type: String, required: true },
        priority: {
          type: String,
          enum: ["essential", "important", "nice-to-have"],
          required: true,
        },
        category: { type: String, required: true },
      },
    ],
    averageSalary: String,
    demandLevel: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "high",
    },
  },
  { timestamps: true }
);

export const Role = mongoose.model<IRole>("Role", roleSchema);
