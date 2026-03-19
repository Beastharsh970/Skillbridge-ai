import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new AppError(409, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      experienceLevel: data.experienceLevel || "beginner",
    });

    const token = generateToken(String(user._id));

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        experienceLevel: user.experienceLevel,
        skills: user.skills,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email }).select("+password");
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError(401, "Invalid email or password");
    }

    const token = generateToken(String(user._id));

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        experienceLevel: user.experienceLevel,
        skills: user.skills,
        resumePath: user.resumePath,
        githubUsername: user.githubUsername,
        resumeParsed: user.resumeParsed,
        githubData: user.githubData,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);
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
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
