import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  skills: string[];
  experienceLevel: "beginner" | "intermediate" | "advanced";
  resumePath?: string;
  resumeParsed?: {
    skills: string[];
    softSkills: string[];
    projects: { name: string; description: string; technologies: string[] }[];
    experience: { title: string; company: string; duration: string; description: string; skills: string[] }[];
    education: { degree: string; institution: string; year: string }[];
    certifications: string[];
    yearsOfExperience: number | null;
    domains: string[];
    rawText: string;
  };
  githubUsername?: string;
  githubData?: {
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
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    skills: [{ type: String, trim: true }],
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    resumePath: String,
    resumeParsed: {
      skills: [String],
      softSkills: [String],
      projects: [
        {
          name: String,
          description: String,
          technologies: [String],
        },
      ],
      experience: [
        {
          title: String,
          company: String,
          duration: String,
          description: String,
          skills: [String],
        },
      ],
      education: [
        {
          degree: String,
          institution: String,
          year: String,
        },
      ],
      certifications: [String],
      yearsOfExperience: Number,
      domains: [String],
      rawText: String,
    },
    githubUsername: String,
    githubData: {
      profile: {
        username: String,
        name: String,
        bio: String,
        publicRepos: Number,
        followers: Number,
        accountAgeYears: Number,
        profileUrl: String,
      },
      repos: [
        {
          name: String,
          description: String,
          language: String,
          stars: Number,
          url: String,
          topics: [String],
          size: Number,
        },
      ],
      languages: Schema.Types.Mixed,
      topics: [String],
      skills: [String],
      stats: {
        totalRepos: Number,
        totalStars: Number,
        topLanguage: String,
        recentlyActive: Number,
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
