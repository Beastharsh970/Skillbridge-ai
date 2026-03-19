import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

// ---------------------------------------------------------------------------
// Provider abstraction — Gemini, OpenAI (ChatGPT), Qwen
// ---------------------------------------------------------------------------

type AIProvider = "gemini" | "openai" | "qwen";

function getProvider(): AIProvider {
  const p = (env.AI_PROVIDER || "gemini").toLowerCase() as AIProvider;
  if (!["gemini", "openai", "qwen"].includes(p)) return "gemini";
  return p;
}

// --- Gemini ------------------------------------------------------------------

function getGeminiModel() {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: env.GEMINI_MODEL || "gemini-2.0-flash",
  });
}

async function geminiGenerate(prompt: string): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// --- OpenAI (ChatGPT) -------------------------------------------------------

function getOpenAIClient() {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

async function openaiGenerate(prompt: string): Promise<string> {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful AI assistant. Always respond with valid JSON only — no markdown, no explanation, just JSON.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || "";
}

// --- Qwen (Alibaba Cloud — OpenAI-compatible API) ----------------------------

function getQwenClient() {
  return new OpenAI({
    apiKey: env.QWEN_API_KEY,
    baseURL: env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });
}

async function qwenGenerate(prompt: string): Promise<string> {
  const client = getQwenClient();
  const completion = await client.chat.completions.create({
    model: env.QWEN_MODEL || "qwen-plus",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful AI assistant. Always respond with valid JSON only — no markdown, no explanation, just JSON.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || "";
}

// ---------------------------------------------------------------------------
// Unified generate function with retry
// ---------------------------------------------------------------------------

async function callProvider(prompt: string): Promise<string> {
  const provider = getProvider();
  switch (provider) {
    case "openai":
      return openaiGenerate(prompt);
    case "qwen":
      return qwenGenerate(prompt);
    case "gemini":
    default:
      return geminiGenerate(prompt);
  }
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

async function generateJSON<T>(prompt: string, retries = 2): Promise<T> {
  const provider = getProvider();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const raw = await callProvider(prompt);
      const cleaned = cleanJsonResponse(raw);

      try {
        return JSON.parse(cleaned) as T;
      } catch {
        throw new AppError(
          502,
          `AI returned invalid JSON. Please try again.`
        );
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;

      const status = err?.status ?? err?.response?.status;
      const isRateLimit = status === 429;
      const isRetryable = isRateLimit || status === 503;

      if (isRetryable && attempt < retries) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (isRateLimit) {
        throw new AppError(
          429,
          `AI rate limit exceeded (${provider}). Please wait a minute and try again, or switch providers in .env.`
        );
      }

      const msg = err?.message || "Unknown AI error";
      throw new AppError(502, `AI provider error (${provider}): ${msg}`);
    }
  }
  throw new AppError(502, `AI provider (${provider}) failed after ${retries + 1} attempts`);
}

// ---------------------------------------------------------------------------
// Exported AI functions (unchanged interface for controllers)
// ---------------------------------------------------------------------------

export interface GapAnalysisResult {
  missingSkills: { name: string; importance: "high" | "medium" | "low"; category: string }[];
  strengths: { name: string; proficiencyEstimate: string }[];
  readinessScore: number;
  skillImportanceRanking: { skill: string; rank: number; reason: string }[];
  personalizedFeedback: string;
  suggestions: string[];
}

export async function analyzeSkillGap(
  userData: {
    skills: string[];
    resumeSkills: string[];
    githubSkills: string[];
    softSkills: string[];
    experience: { title: string; company: string; duration: string; skills: string[] }[];
    education: { degree: string; institution: string; year: string }[];
    certifications: string[];
    yearsOfExperience: number | null;
    domains: string[];
    experienceLevel: string;
    github: {
      totalRepos: number;
      totalStars: number;
      topLanguage: string;
      recentlyActiveRepos: number;
      topics: string[];
      accountAgeYears: number;
    } | null;
  },
  roleData: {
    title: string;
    requiredSkills: { name: string; priority: string; category: string }[];
  }
): Promise<GapAnalysisResult> {
  const prompt = `You are an expert career advisor and tech recruiter. Perform a comprehensive skill gap analysis between this candidate and the target role.

CANDIDATE PROFILE:
${JSON.stringify(userData, null, 2)}

TARGET ROLE:
${JSON.stringify(roleData, null, 2)}

INSTRUCTIONS:
1. Compare the user's combined skills (resume + GitHub + manual) against the role's required skills. Consider skill aliases (e.g., "tailwind" = "tailwindcss").
2. Factor in their work experience — roles at known companies, duration, and technologies used on the job carry more weight than just listing a skill.
3. Consider their education and certifications — relevant degrees/certs boost readiness.
4. Use GitHub activity signals — total repos, stars, recently active repos, and topics indicate real hands-on experience vs. theoretical knowledge.
5. Account for soft skills and domain expertise that are relevant to the target role.
6. Calculate a readiness score (0-100) holistically: skill coverage (40%), experience depth (25%), GitHub evidence (20%), education/certs (15%).
7. Rank the most important missing skills to learn first with clear reasoning.
8. Provide personalized, actionable feedback (2-3 paragraphs) referencing their specific background.
9. Give 4-6 specific, actionable suggestions for improvement.

RESPOND WITH ONLY VALID JSON in this exact format:
{
  "missingSkills": [{"name": "string", "importance": "high|medium|low", "category": "string"}],
  "strengths": [{"name": "string", "proficiencyEstimate": "string"}],
  "readinessScore": number,
  "skillImportanceRanking": [{"skill": "string", "rank": number, "reason": "string"}],
  "personalizedFeedback": "string",
  "suggestions": ["string"]
}`;

  return generateJSON<GapAnalysisResult>(prompt);
}

export interface RoadmapResult {
  items: {
    skill: string;
    level: "beginner" | "intermediate" | "advanced";
    timeEstimate: string;
    courses: { title: string; url: string; platform: string; isFree: boolean }[];
    projects: { title: string; description: string; difficulty: string }[];
    practiceTasks: string[];
    order: number;
  }[];
  totalEstimatedTime: string;
}

export async function generateRoadmap(
  missingSkills: { name: string; importance: string }[],
  experienceLevel: string
): Promise<RoadmapResult> {
  const prompt = `You are an expert learning path designer for software developers.

Create a personalized learning roadmap for a ${experienceLevel}-level developer who needs to learn these skills:
${JSON.stringify(missingSkills, null, 2)}

INSTRUCTIONS:
1. Order skills from highest priority to lowest.
2. For each skill, provide real courses (mix of free and paid) from platforms like freeCodeCamp, Udemy, Coursera, YouTube, MDN, etc.
3. Include practical project ideas with increasing difficulty.
4. Add specific practice tasks (exercises, challenges, coding problems).
5. Estimate realistic time for each skill based on the experience level.
6. Categorize the learning level for each item.

RESPOND WITH ONLY VALID JSON in this exact format:
{
  "items": [
    {
      "skill": "string",
      "level": "beginner|intermediate|advanced",
      "timeEstimate": "string (e.g. '2-3 weeks')",
      "courses": [{"title": "string", "url": "string", "platform": "string", "isFree": true|false}],
      "projects": [{"title": "string", "description": "string", "difficulty": "beginner|intermediate|advanced"}],
      "practiceTasks": ["string"],
      "order": number
    }
  ],
  "totalEstimatedTime": "string"
}`;

  return generateJSON<RoadmapResult>(prompt);
}

export interface InterviewQuestionsResult {
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
}

export async function generateInterviewQuestions(
  skills: string[],
  role: string
): Promise<InterviewQuestionsResult> {
  const prompt = `You are a senior technical interviewer preparing questions for a ${role} position.

The candidate should be tested on these skills: ${JSON.stringify(skills)}

Generate a comprehensive mock interview question set.

INSTRUCTIONS:
1. Create 5 technical questions testing specific skill knowledge.
2. Create 3 behavioral questions relevant to the role.
3. Create 3 coding/problem-solving questions.
4. Vary difficulty across easy, medium, and hard.
5. Provide expected answers for technical questions and tips for behavioral ones.

RESPOND WITH ONLY VALID JSON in this exact format:
{
  "technical": [{"question": "string", "expectedAnswer": "string", "difficulty": "easy|medium|hard", "skill": "string"}],
  "behavioral": [{"question": "string", "tip": "string", "category": "string"}],
  "coding": [{"question": "string", "hints": ["string"], "difficulty": "easy|medium|hard", "relatedSkill": "string"}]
}`;

  return generateJSON<InterviewQuestionsResult>(prompt);
}

export interface ImprovedResumeResult {
  summary: string;
  experience: {
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  certifications: string[];
  improvements: string[];
}

export async function improveResume(
  resumeData: {
    skills: string[];
    softSkills: string[];
    experience: { title: string; company: string; duration: string; description: string }[];
    projects: { name: string; description: string; technologies: string[] }[];
    education: { degree: string; institution: string; year: string }[];
    certifications: string[];
    yearsOfExperience: number | null;
  },
  targetRole?: string
): Promise<ImprovedResumeResult> {
  const prompt = `You are an expert resume writer and career coach. Improve this resume to be professional, ATS-friendly, and impactful.

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

${targetRole ? `TARGET ROLE: ${targetRole}` : ""}

INSTRUCTIONS:
1. Write a strong professional summary (2-3 sentences) highlighting key strengths and years of experience.
2. Rewrite each work experience with powerful, quantified bullet points (use action verbs, add metrics where plausible like "Improved performance by 40%"). Keep 3-5 bullets per role.
3. Improve project descriptions to be concise and impact-focused. Keep technologies listed.
4. Organize skills into logical categories (Languages, Frameworks, Databases, DevOps, etc.).
5. Keep education and certifications as-is but format them properly.
6. List 3-5 specific improvements you made and why.

RESPOND WITH ONLY VALID JSON:
{
  "summary": "string",
  "experience": [{"title": "string", "company": "string", "duration": "string", "bullets": ["string"]}],
  "projects": [{"name": "string", "description": "string", "technologies": ["string"]}],
  "skills": [{"category": "string", "items": ["string"]}],
  "education": [{"degree": "string", "institution": "string", "year": "string"}],
  "certifications": ["string"],
  "improvements": ["string"]
}`;

  return generateJSON<ImprovedResumeResult>(prompt);
}

export interface ParsedJobDescription {
  roleTitle: string;
  company: string;
  requiredSkills: { name: string; priority: "essential" | "important" | "nice-to-have"; category: string }[];
  description: string;
  experienceLevel: string;
}

export async function parseJobDescription(rawText: string): Promise<ParsedJobDescription> {
  const prompt = `You are an expert tech recruiter. Parse this job posting/description and extract structured data from it.

JOB POSTING TEXT:
${rawText.substring(0, 6000)}

INSTRUCTIONS:
1. Identify the role title (e.g. "Senior Frontend Developer").
2. Identify the company name if mentioned, otherwise "".
3. Extract ALL required/preferred skills and technologies mentioned.
4. Classify each skill as "essential" (must-have / required), "important" (preferred / strongly desired), or "nice-to-have" (bonus / plus).
5. Categorize each skill (e.g. Language, Framework, Database, Cloud, DevOps, etc.).
6. Determine the experience level: "beginner" (0-2 years), "intermediate" (2-5 years), or "advanced" (5+ years).
7. Write a 1-2 sentence clean summary of the role.

RESPOND WITH ONLY VALID JSON:
{
  "roleTitle": "string",
  "company": "string",
  "requiredSkills": [{"name": "string", "priority": "essential|important|nice-to-have", "category": "string"}],
  "description": "string",
  "experienceLevel": "beginner|intermediate|advanced"
}`;

  return generateJSON<ParsedJobDescription>(prompt);
}

export async function chatWithContext(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userContext: {
    name: string;
    skills: string[];
    experienceLevel: string;
    resumeSkills?: string[];
    softSkills?: string[];
    experience?: { title: string; company: string; duration: string }[];
    education?: { degree: string; year: string }[];
    certifications?: string[];
    yearsOfExperience?: number | null;
    domains?: string[];
    githubSkills?: string[];
    githubStats?: { totalRepos: number; totalStars: number; topLanguage: string };
  }
): Promise<string> {
  const systemPrompt = `You are SkillBridge AI Career Advisor — an expert career coach specializing in tech careers, skill development, and job preparation.

USER PROFILE CONTEXT:
- Name: ${userContext.name}
- Experience Level: ${userContext.experienceLevel}
${userContext.yearsOfExperience ? `- Years of Experience: ${userContext.yearsOfExperience}` : ""}
- Technical Skills: ${(userContext.skills || []).join(", ") || "None detected yet"}
${userContext.resumeSkills?.length ? `- Resume Skills: ${userContext.resumeSkills.join(", ")}` : ""}
${userContext.softSkills?.length ? `- Soft Skills: ${userContext.softSkills.join(", ")}` : ""}
${userContext.githubSkills?.length ? `- GitHub Skills: ${userContext.githubSkills.join(", ")}` : ""}
${userContext.experience?.length ? `- Work Experience: ${userContext.experience.map((e) => `${e.title} at ${e.company} (${e.duration})`).join("; ")}` : ""}
${userContext.education?.length ? `- Education: ${userContext.education.map((e) => `${e.degree} (${e.year})`).join("; ")}` : ""}
${userContext.certifications?.length ? `- Certifications: ${userContext.certifications.join(", ")}` : ""}
${userContext.domains?.length ? `- Domain Expertise: ${userContext.domains.join(", ")}` : ""}
${userContext.githubStats ? `- GitHub: ${userContext.githubStats.totalRepos} repos, ${userContext.githubStats.totalStars} stars, top language: ${userContext.githubStats.topLanguage}` : ""}

RULES:
1. Only answer questions related to careers, jobs, skills, learning, interview preparation, resume improvement, and professional growth in tech.
2. If the user asks something unrelated (e.g. cooking, weather, general chat), politely redirect them back to career topics.
3. Use the user's profile context to give personalized, specific advice — not generic answers.
4. Be encouraging but honest about skill gaps.
5. Suggest concrete next steps, resources, or actions when possible.
6. Keep responses concise but thorough (2-4 paragraphs max unless they ask for detail).
7. Use markdown formatting for readability (bold, lists, etc.).`;

  const historyText = conversationHistory
    .slice(-10)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const fullPrompt = `${systemPrompt}

CONVERSATION HISTORY:
${historyText || "(No prior messages)"}

User: ${userMessage}

Respond as the career advisor. Use markdown formatting.`;

  return callProvider(fullPrompt);
}
