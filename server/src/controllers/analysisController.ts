import { Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { Analysis } from "../models/Analysis";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { analyzeSkillGap, parseJobDescription } from "../services/geminiService";

const gapAnalysisSchema = z.object({
  roleId: z.string().min(1),
});

export async function performGapAnalysis(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { roleId } = gapAnalysisSchema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, "User not found");

    const role = await Role.findById(roleId);
    if (!role) throw new AppError(404, "Role not found");

    const allSkills = new Set<string>([
      ...user.skills,
      ...(user.resumeParsed?.skills || []),
      ...(user.githubData?.skills || []),
    ]);

    const result = await analyzeSkillGap(
      {
        skills: Array.from(allSkills),
        resumeSkills: user.resumeParsed?.skills || [],
        githubSkills: user.githubData?.skills || [],
        softSkills: user.resumeParsed?.softSkills || [],
        experience: user.resumeParsed?.experience?.map((e) => ({
          title: e.title,
          company: e.company,
          duration: e.duration,
          skills: e.skills || [],
        })) || [],
        education: user.resumeParsed?.education || [],
        certifications: user.resumeParsed?.certifications || [],
        yearsOfExperience: user.resumeParsed?.yearsOfExperience ?? null,
        domains: user.resumeParsed?.domains || [],
        experienceLevel: user.experienceLevel,
        github: user.githubData ? {
          totalRepos: user.githubData.stats?.totalRepos || 0,
          totalStars: user.githubData.stats?.totalStars || 0,
          topLanguage: user.githubData.stats?.topLanguage || "",
          recentlyActiveRepos: user.githubData.stats?.recentlyActive || 0,
          topics: user.githubData.topics || [],
          accountAgeYears: user.githubData.profile?.accountAgeYears || 0,
        } : null,
      },
      {
        title: role.title,
        requiredSkills: role.requiredSkills.map((s) => ({
          name: s.name,
          priority: s.priority,
          category: s.category,
        })),
      }
    );

    const analysis = await Analysis.create({
      userId: user._id,
      roleId: role._id,
      roleName: role.title,
      userSkills: Array.from(allSkills),
      missingSkills: result.missingSkills,
      strengths: result.strengths,
      readinessScore: result.readinessScore,
      skillImportanceRanking: result.skillImportanceRanking,
      personalizedFeedback: result.personalizedFeedback,
      suggestions: result.suggestions,
    });

    res.json({ analysis });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const analyses = await Analysis.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ analyses });
  } catch (err) {
    next(err);
  }
}

export async function getAnalysisById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!analysis) throw new AppError(404, "Analysis not found");
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
}

const parseJDSchema = z.object({
  text: z.string().min(20, "Job description too short"),
});

export async function parseJD(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { text } = parseJDSchema.parse(req.body);
    const parsed = await parseJobDescription(text);
    res.json({ parsed });
  } catch (err) {
    next(err);
  }
}

const jdGapAnalysisSchema = z.object({
  roleTitle: z.string().min(1),
  requiredSkills: z.array(z.object({
    name: z.string(),
    priority: z.enum(["essential", "important", "nice-to-have"]),
    category: z.string(),
  })),
});

export async function gapAnalysisFromJD(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { roleTitle, requiredSkills } = jdGapAnalysisSchema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, "User not found");

    const allSkills = new Set<string>([
      ...user.skills,
      ...(user.resumeParsed?.skills || []),
      ...(user.githubData?.skills || []),
    ]);

    const result = await analyzeSkillGap(
      {
        skills: Array.from(allSkills),
        resumeSkills: user.resumeParsed?.skills || [],
        githubSkills: user.githubData?.skills || [],
        softSkills: user.resumeParsed?.softSkills || [],
        experience: user.resumeParsed?.experience?.map((e) => ({
          title: e.title, company: e.company, duration: e.duration, skills: e.skills || [],
        })) || [],
        education: user.resumeParsed?.education || [],
        certifications: user.resumeParsed?.certifications || [],
        yearsOfExperience: user.resumeParsed?.yearsOfExperience ?? null,
        domains: user.resumeParsed?.domains || [],
        experienceLevel: user.experienceLevel,
        github: user.githubData ? {
          totalRepos: user.githubData.stats?.totalRepos || 0,
          totalStars: user.githubData.stats?.totalStars || 0,
          topLanguage: user.githubData.stats?.topLanguage || "",
          recentlyActiveRepos: user.githubData.stats?.recentlyActive || 0,
          topics: user.githubData.topics || [],
          accountAgeYears: user.githubData.profile?.accountAgeYears || 0,
        } : null,
      },
      { title: roleTitle, requiredSkills }
    );

    const analysis = await Analysis.create({
      userId: user._id,
      roleId: null,
      roleName: roleTitle,
      userSkills: Array.from(allSkills),
      missingSkills: result.missingSkills,
      strengths: result.strengths,
      readinessScore: result.readinessScore,
      skillImportanceRanking: result.skillImportanceRanking,
      personalizedFeedback: result.personalizedFeedback,
      suggestions: result.suggestions,
    });

    res.json({ analysis });
  } catch (err) {
    next(err);
  }
}
