import mongoose, { Schema, Document } from "mongoose";

export interface IRoadmapItem {
  skill: string;
  level: "beginner" | "intermediate" | "advanced";
  timeEstimate: string;
  courses: { title: string; url: string; platform: string; isFree: boolean }[];
  projects: { title: string; description: string; difficulty: string }[];
  practiceTasks: string[];
  order: number;
}

export interface IRoadmap extends Document {
  userId: mongoose.Types.ObjectId;
  analysisId: mongoose.Types.ObjectId;
  roleName: string;
  experienceLevel: string;
  items: IRoadmapItem[];
  totalEstimatedTime: string;
  createdAt: Date;
}

const roadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis", required: true },
    roleName: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    items: [
      {
        skill: { type: String, required: true },
        level: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
        timeEstimate: String,
        courses: [
          {
            title: String,
            url: String,
            platform: String,
            isFree: Boolean,
          },
        ],
        projects: [
          {
            title: String,
            description: String,
            difficulty: String,
          },
        ],
        practiceTasks: [String],
        order: Number,
      },
    ],
    totalEstimatedTime: String,
  },
  { timestamps: true }
);

export const Roadmap = mongoose.model<IRoadmap>("Roadmap", roadmapSchema);
