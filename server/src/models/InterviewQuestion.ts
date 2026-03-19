import mongoose, { Schema, Document } from "mongoose";

export interface IInterviewQuestion extends Document {
  userId: mongoose.Types.ObjectId;
  roleName: string;
  targetSkills: string[];
  technical: {
    question: string;
    expectedAnswer: string;
    difficulty: "easy" | "medium" | "hard";
    skill: string;
  }[];
  behavioral: {
    question: string;
    tip: string;
    category: string;
  }[];
  coding: {
    question: string;
    hints: string[];
    difficulty: "easy" | "medium" | "hard";
    relatedSkill: string;
  }[];
  createdAt: Date;
}

const interviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleName: { type: String, required: true },
    targetSkills: [String],
    technical: [
      {
        question: String,
        expectedAnswer: String,
        difficulty: { type: String, enum: ["easy", "medium", "hard"] },
        skill: String,
      },
    ],
    behavioral: [
      {
        question: String,
        tip: String,
        category: String,
      },
    ],
    coding: [
      {
        question: String,
        hints: [String],
        difficulty: { type: String, enum: ["easy", "medium", "hard"] },
        relatedSkill: String,
      },
    ],
  },
  { timestamps: true }
);

export const InterviewQuestion = mongoose.model<IInterviewQuestion>(
  "InterviewQuestion",
  interviewQuestionSchema
);
