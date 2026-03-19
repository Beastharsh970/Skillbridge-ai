export interface User {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experienceLevel: "beginner" | "intermediate" | "advanced";
  resumePath?: string;
  resumeParsed?: ResumeParsed;
  githubUsername?: string;
  githubData?: GitHubData;
  createdAt?: string;
}

export interface ResumeParsed {
  skills: string[];
  softSkills: string[];
  projects: { name: string; description: string; technologies: string[] }[];
  experience: { title: string; company: string; duration: string; description: string; skills: string[] }[];
  education: { degree: string; institution: string; year: string }[];
  certifications: string[];
  yearsOfExperience: number | null;
  domains: string[];
  rawText?: string;
}

export interface GitHubData {
  profile: {
    username: string;
    name: string;
    bio: string;
    publicRepos: number;
    followers: number;
    accountAgeYears: number;
    profileUrl: string;
  };
  repos: { name: string; description: string; language: string; stars: number; url: string; topics: string[]; size: number }[];
  languages: Record<string, number>;
  topics: string[];
  skills: string[];
  stats: {
    totalRepos: number;
    totalStars: number;
    topLanguage: string;
    recentlyActive: number;
  };
}

export interface RoleSkill {
  name: string;
  priority: "essential" | "important" | "nice-to-have";
  category: string;
}

export interface Role {
  _id: string;
  title: string;
  slug: string;
  description: string;
  requiredSkills: RoleSkill[];
  averageSalary?: string;
  demandLevel: "high" | "medium" | "low";
}

export interface Analysis {
  _id: string;
  userId: string;
  roleId: string;
  roleName: string;
  userSkills: string[];
  missingSkills: { name: string; importance: "high" | "medium" | "low"; category: string }[];
  strengths: { name: string; proficiencyEstimate: string }[];
  readinessScore: number;
  skillImportanceRanking: { skill: string; rank: number; reason: string }[];
  personalizedFeedback: string;
  suggestions: string[];
  createdAt: string;
}

export interface RoadmapItem {
  skill: string;
  level: "beginner" | "intermediate" | "advanced";
  timeEstimate: string;
  courses: { title: string; url: string; platform: string; isFree: boolean }[];
  projects: { title: string; description: string; difficulty: string }[];
  practiceTasks: string[];
  order: number;
}

export interface Roadmap {
  _id: string;
  userId: string;
  analysisId: string;
  roleName: string;
  experienceLevel: string;
  items: RoadmapItem[];
  totalEstimatedTime: string;
  createdAt: string;
}

export interface InterviewQuestions {
  _id: string;
  userId: string;
  roleName: string;
  targetSkills: string[];
  technical: { question: string; expectedAnswer: string; difficulty: "easy" | "medium" | "hard"; skill: string }[];
  behavioral: { question: string; tip: string; category: string }[];
  coding: { question: string; hints: string[]; difficulty: "easy" | "medium" | "hard"; relatedSkill: string }[];
  createdAt: string;
}
