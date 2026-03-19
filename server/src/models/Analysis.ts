import mongoose, { Schema, Document } from "mongoose";

export interface IAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  roleName: string;
  userSkills: string[];
  missingSkills: { name: string; importance: "high" | "medium" | "low"; category: string }[];
  strengths: { name: string; proficiencyEstimate: string }[];
  readinessScore: number;
  skillImportanceRanking: { skill: string; rank: number; reason: string }[];
  personalizedFeedback: string;
  suggestions: string[];
  createdAt: Date;
}

const analysisSchema = new Schema<IAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    roleName: { type: String, required: true },
    userSkills: [String],
    missingSkills: [
      {
        name: { type: String, required: true },
        importance: { type: String, enum: ["high", "medium", "low"], required: true },
        category: String,
      },
    ],
    strengths: [
      {
        name: { type: String, required: true },
        proficiencyEstimate: String,
      },
    ],
    readinessScore: { type: Number, required: true, min: 0, max: 100 },
    skillImportanceRanking: [
      {
        skill: String,
        rank: Number,
        reason: String,
      },
    ],
    personalizedFeedback: { type: String, required: true },
    suggestions: [String],
  },
  { timestamps: true }
);

export const Analysis = mongoose.model<IAnalysis>("Analysis", analysisSchema);
