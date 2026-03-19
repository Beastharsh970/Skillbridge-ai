import { Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Chat } from "../models/Chat";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { chatWithContext } from "../services/geminiService";

const sendMessageSchema = z.object({
  chatId: z.string().optional(),
  message: z.string().min(1).max(4000),
});

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { chatId, message } = sendMessageSchema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, "User not found");

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId: req.userId });
      if (!chat) throw new AppError(404, "Chat not found");
    } else {
      chat = await Chat.create({
        userId: req.userId,
        title: message.substring(0, 60) + (message.length > 60 ? "..." : ""),
        messages: [],
      });
    }

    chat.messages.push({ role: "user", content: message, timestamp: new Date() });

    const userContext = {
      name: user.name,
      skills: user.skills,
      experienceLevel: user.experienceLevel,
      resumeSkills: user.resumeParsed?.skills,
      softSkills: user.resumeParsed?.softSkills,
      experience: user.resumeParsed?.experience?.map((e) => ({
        title: e.title,
        company: e.company,
        duration: e.duration,
      })),
      education: user.resumeParsed?.education?.map((e) => ({
        degree: e.degree,
        year: e.year,
      })),
      certifications: user.resumeParsed?.certifications,
      yearsOfExperience: user.resumeParsed?.yearsOfExperience,
      domains: user.resumeParsed?.domains,
      githubSkills: user.githubData?.skills,
      githubStats: user.githubData?.stats ? {
        totalRepos: user.githubData.stats.totalRepos,
        totalStars: user.githubData.stats.totalStars,
        topLanguage: user.githubData.stats.topLanguage,
      } : undefined,
    };

    const history = chat.messages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const reply = await chatWithContext(message, history, userContext);

    chat.messages.push({ role: "assistant", content: reply, timestamp: new Date() });
    await chat.save();

    res.json({
      chatId: chat._id,
      title: chat.title,
      reply,
    });
  } catch (err) {
    next(err);
  }
}

export async function getChats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .select("title createdAt updatedAt messages")
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    const list = chats.map((c) => ({
      _id: c._id,
      title: c.title,
      messageCount: c.messages.length,
      lastMessage: c.messages[c.messages.length - 1]?.content?.substring(0, 80) || "",
      updatedAt: c.updatedAt,
    }));

    res.json({ chats: list });
  } catch (err) {
    next(err);
  }
}

export async function getChatById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) throw new AppError(404, "Chat not found");
    res.json({ chat });
  } catch (err) {
    next(err);
  }
}

export async function deleteChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) throw new AppError(404, "Chat not found");
    res.json({ message: "Chat deleted" });
  } catch (err) {
    next(err);
  }
}
