import { Response, NextFunction } from "express";
import { z } from "zod";
import { Analysis } from "../models/Analysis";
import { InterviewQuestion } from "../models/InterviewQuestion";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { generateInterviewQuestions } from "../services/geminiService";

const generateQuestionsSchema = z.object({
  analysisId: z.string().min(1),
});

export async function createInterviewQuestions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { analysisId } = generateQuestionsSchema.parse(req.body);

    const analysis = await Analysis.findOne({ _id: analysisId, userId: req.userId });
    if (!analysis) throw new AppError(404, "Analysis not found");

    const targetSkills = [
      ...analysis.missingSkills.map((s) => s.name),
      ...analysis.strengths.slice(0, 3).map((s) => s.name),
    ];

    const result = await generateInterviewQuestions(targetSkills, analysis.roleName);

    const questions = await InterviewQuestion.create({
      userId: req.userId,
      roleName: analysis.roleName,
      targetSkills,
      technical: result.technical,
      behavioral: result.behavioral,
      coding: result.coding,
    });

    res.json({ questions });
  } catch (err) {
    next(err);
  }
}

export async function getInterviewQuestions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const questions = await InterviewQuestion.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ questions });
  } catch (err) {
    next(err);
  }
}

const addMoreSchema = z.object({
  questionSetId: z.string().min(1),
  category: z.enum(["technical", "behavioral", "coding"]).optional(),
  focusSkills: z.array(z.string()).optional(),
});

export async function addMoreQuestions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { questionSetId, category, focusSkills } = addMoreSchema.parse(req.body);

    const existing = await InterviewQuestion.findOne({ _id: questionSetId, userId: req.userId });
    if (!existing) throw new AppError(404, "Question set not found");

    const skills = focusSkills && focusSkills.length > 0
      ? focusSkills
      : existing.targetSkills;

    const result = await generateInterviewQuestions(skills, existing.roleName);

    const update: Record<string, any> = {};

    if (!category || category === "technical") {
      update.$push = { ...update.$push, technical: { $each: result.technical } };
    }
    if (!category || category === "behavioral") {
      update.$push = { ...update.$push, behavioral: { $each: result.behavioral } };
    }
    if (!category || category === "coding") {
      update.$push = { ...update.$push, coding: { $each: result.coding } };
    }

    const updated = await InterviewQuestion.findByIdAndUpdate(questionSetId, update, { new: true });

    res.json({ questions: updated });
  } catch (err) {
    next(err);
  }
}

export async function getInterviewQuestionsById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const questions = await InterviewQuestion.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!questions) throw new AppError(404, "Interview questions not found");
    res.json({ questions });
  } catch (err) {
    next(err);
  }
}
