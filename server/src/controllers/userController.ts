import { Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { parseResume } from "../services/resumeParser";
import { fetchGitHubProfile } from "../services/githubService";
import { improveResume } from "../services/geminiService";
import { generateResumePDF } from "../services/resumeGenerator";

export async function uploadResume(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError(400, "No file uploaded");

    const parsed = await parseResume(req.file.path);

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        resumePath: req.file.path,
        resumeParsed: parsed,
        $addToSet: { skills: { $each: parsed.skills } },
      },
      { new: true }
    );

    if (!user) throw new AppError(404, "User not found");

    res.json({
      message: "Resume uploaded and parsed successfully",
      parsed: {
        skills: parsed.skills,
        projects: parsed.projects,
        experience: parsed.experience,
      },
      userSkills: user.skills,
    });
  } catch (err) {
    next(err);
  }
}

const githubSchema = z.object({
  username: z.string().min(1).max(39),
});

export async function connectGitHub(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { username } = githubSchema.parse(req.body);

    const githubData = await fetchGitHubProfile(username);

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        githubUsername: username,
        githubData,
        $addToSet: { skills: { $each: githubData.skills } },
      },
      { new: true }
    );

    if (!user) throw new AppError(404, "User not found");

    res.json({
      message: "GitHub profile connected successfully",
      githubData: {
        repos: githubData.repos,
        languages: githubData.languages,
        skills: githubData.skills,
      },
      userSkills: user.skills,
    });
  } catch (err) {
    next(err);
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  skills: z.array(z.string()).optional(),
});

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(req.userId, data, { new: true });
    if (!user) throw new AppError(404, "User not found");

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        experienceLevel: user.experienceLevel,
        skills: user.skills,
        resumePath: user.resumePath,
        resumeParsed: user.resumeParsed,
        githubUsername: user.githubUsername,
        githubData: user.githubData,
      },
    });
  } catch (err) {
    next(err);
  }
}

const updateResumeDataSchema = z.object({
  skills: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  yearsOfExperience: z.number().nullable().optional(),
  domains: z.array(z.string()).optional(),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.string(),
  })).optional(),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    duration: z.string(),
    description: z.string(),
    skills: z.array(z.string()),
  })).optional(),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
  })).optional(),
});

export async function updateResumeData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateResumeDataSchema.parse(req.body);
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, "User not found");
    if (!user.resumeParsed) throw new AppError(400, "No resume data to update. Upload a resume first.");

    const update: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        update[`resumeParsed.${key}`] = value;
      }
    }

    if (data.skills) {
      const allSkills = new Set([
        ...user.skills.filter((s) => !(user.resumeParsed?.skills || []).includes(s)),
        ...data.skills,
      ]);
      update.skills = Array.from(allSkills);
    }

    const updated = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true });

    res.json({
      message: "Resume data updated successfully",
      user: {
        id: updated!._id,
        name: updated!.name,
        email: updated!.email,
        skills: updated!.skills,
        experienceLevel: updated!.experienceLevel,
        resumeParsed: updated!.resumeParsed,
        githubUsername: updated!.githubUsername,
        githubData: updated!.githubData,
      },
    });
  } catch (err) {
    next(err);
  }
}

const improveResumeSchema = z.object({
  targetRole: z.string().optional(),
});

export async function improveResumeEndpoint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { targetRole } = improveResumeSchema.parse(req.body);
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, "User not found");
    if (!user.resumeParsed) throw new AppError(400, "Upload a resume first");

    const result = await improveResume(
      {
        skills: user.resumeParsed.skills || [],
        softSkills: user.resumeParsed.softSkills || [],
        experience: (user.resumeParsed.experience || []).map((e) => ({
          title: e.title,
          company: e.company,
          duration: e.duration,
          description: e.description,
        })),
        projects: user.resumeParsed.projects || [],
        education: user.resumeParsed.education || [],
        certifications: user.resumeParsed.certifications || [],
        yearsOfExperience: user.resumeParsed.yearsOfExperience ?? null,
      },
      targetRole
    );

    res.json({ improved: result });
  } catch (err) {
    next(err);
  }
}

export async function downloadImprovedResume(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, "User not found");

    const data = req.body;
    if (!data?.summary) throw new AppError(400, "No improved resume data provided");

    const doc = generateResumePDF(data, user.name, user.email);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${user.name.replace(/\s+/g, "_")}_Resume.pdf"`);

    doc.pipe(res);
  } catch (err) {
    next(err);
  }
}
