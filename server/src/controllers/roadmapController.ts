import { Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Analysis } from "../models/Analysis";
import { Roadmap } from "../models/Roadmap";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { generateRoadmap } from "../services/geminiService";

const generateRoadmapSchema = z.object({
  analysisId: z.string().min(1),
});

export async function createRoadmap(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { analysisId } = generateRoadmapSchema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, "User not found");

    const analysis = await Analysis.findOne({ _id: analysisId, userId: req.userId });
    if (!analysis) throw new AppError(404, "Analysis not found");

    const result = await generateRoadmap(
      analysis.missingSkills.map((s) => ({ name: s.name, importance: s.importance })),
      user.experienceLevel
    );

    const roadmap = await Roadmap.create({
      userId: user._id,
      analysisId: analysis._id,
      roleName: analysis.roleName,
      experienceLevel: user.experienceLevel,
      items: result.items,
      totalEstimatedTime: result.totalEstimatedTime,
    });

    res.json({ roadmap });
  } catch (err) {
    next(err);
  }
}

export async function getRoadmaps(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const roadmaps = await Roadmap.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ roadmaps });
  } catch (err) {
    next(err);
  }
}

export async function getRoadmapById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!roadmap) throw new AppError(404, "Roadmap not found");
    res.json({ roadmap });
  } catch (err) {
    next(err);
  }
}
