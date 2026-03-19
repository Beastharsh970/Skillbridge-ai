import { create } from "zustand";
import api from "@/lib/api";
import type { Role, Analysis, Roadmap, InterviewQuestions } from "@/types";

interface LoadingState {
  resume: boolean;
  github: boolean;
  analysis: boolean;
  roadmap: boolean;
  interview: boolean;
  interviewMore: boolean;
  resumeImprove: boolean;
  resumeData: boolean;
}

interface AppState {
  roles: Role[];
  analyses: Analysis[];
  roadmaps: Roadmap[];
  interviewSets: InterviewQuestions[];
  currentAnalysis: Analysis | null;
  currentRoadmap: Roadmap | null;
  currentInterview: InterviewQuestions | null;
  loading: LoadingState;
  error: string | null;

  fetchRoles: () => Promise<void>;
  uploadResume: (file: File) => Promise<any>;
  updateResumeData: (data: Record<string, any>) => Promise<any>;
  improveResume: (targetRole?: string) => Promise<any>;
  downloadImprovedResume: (data: any) => Promise<Blob>;
  connectGitHub: (username: string) => Promise<any>;
  runGapAnalysis: (roleId: string) => Promise<Analysis>;
  parseJobDescription: (text: string) => Promise<any>;
  runGapAnalysisFromJD: (roleTitle: string, requiredSkills: any[]) => Promise<Analysis>;
  generateRoadmap: (analysisId: string) => Promise<Roadmap>;
  generateInterviewQuestions: (analysisId: string) => Promise<InterviewQuestions>;
  addMoreInterviewQuestions: (questionSetId: string, category?: string, focusSkills?: string[]) => Promise<InterviewQuestions>;
  fetchAnalyses: () => Promise<void>;
  fetchRoadmaps: () => Promise<void>;
  fetchInterviewSets: () => Promise<void>;
  setCurrentAnalysis: (a: Analysis | null) => void;
  setCurrentRoadmap: (r: Roadmap | null) => void;
  setCurrentInterview: (i: InterviewQuestions | null) => void;
  clearError: () => void;
}

const initialLoading: LoadingState = {
  resume: false,
  github: false,
  analysis: false,
  roadmap: false,
  interview: false,
  interviewMore: false,
  resumeImprove: false,
  resumeData: false,
};

export const useAppStore = create<AppState>((set) => ({
  roles: [],
  analyses: [],
  roadmaps: [],
  interviewSets: [],
  currentAnalysis: null,
  currentRoadmap: null,
  currentInterview: null,
  loading: { ...initialLoading },
  error: null,

  fetchRoles: async () => {
    try {
      const { data } = await api.get("/roles");
      set({ roles: data.roles });
    } catch (err: any) {
      set({ error: err.response?.data?.error || "Failed to fetch roles" });
    }
  },

  uploadResume: async (file: File) => {
    set((s) => ({ loading: { ...s.loading, resume: true }, error: null }));
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const { data } = await api.post("/user/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set((s) => ({ loading: { ...s.loading, resume: false } }));
      return data;
    } catch (err: any) {
      set((s) => ({ error: err.response?.data?.error || "Upload failed", loading: { ...s.loading, resume: false } }));
      throw err;
    }
  },

  updateResumeData: async (data: Record<string, any>) => {
    set((s) => ({ loading: { ...s.loading, resumeData: true }, error: null }));
    try {
      const { data: res } = await api.put("/user/resume-data", data);
      set((s) => ({ loading: { ...s.loading, resumeData: false } }));
      return res;
    } catch (err: any) {
      set((s) => ({ error: err.response?.data?.error || "Update failed", loading: { ...s.loading, resumeData: false } }));
      throw err;
    }
  },

  improveResume: async (targetRole?: string) => {
    set((s) => ({ loading: { ...s.loading, resumeImprove: true }, error: null }));
    try {
      const { data } = await api.post("/user/resume-improve", { targetRole });
      set((s) => ({ loading: { ...s.loading, resumeImprove: false } }));
      return data.improved;
    } catch (err: any) {
      set((s) => ({ error: err.response?.data?.error || "Resume improvement failed", loading: { ...s.loading, resumeImprove: false } }));
      throw err;
    }
  },

  downloadImprovedResume: async (data: any) => {
    const response = await api.post("/user/resume-download", data, {
      responseType: "blob",
    });
    return response.data;
  },

  connectGitHub: async (username: string) => {
    set((s) => ({ loading: { ...s.loading, github: true }, error: null }));
    try {
      const { data } = await api.post("/user/github", { username });
      set((s) => ({ loading: { ...s.loading, github: false } }));
      return data;
    } catch (err: any) {
      set((s) => ({ error: err.response?.data?.error || "GitHub connection failed", loading: { ...s.loading, github: false } }));
      throw err;
    }
  },

  runGapAnalysis: async (roleId: string) => {
    set((s) => ({ loading: { ...s.loading, analysis: true }, error: null }));
    try {
      const { data } = await api.post("/analysis/gap", { roleId });
      set((s) => ({
        analyses: [data.analysis, ...s.analyses],
        currentAnalysis: data.analysis,
        loading: { ...s.loading, analysis: false },
      }));
      return data.analysis;
    } catch (err: any) {
      set((s) => ({ error: err.response?.data?.error || "Analysis failed", loading: { ...s.loading, analysis: false } }));
      throw err;
    }
  },

  parseJobDescription: async (text: string) => {
    set((s) => ({ loading: { ...s.loading, analysis: true }, error: null }));
    try {
      const { data } = await api.post("/analysis/parse-jd", { text });
      set((s) => ({ loading: { ...s.loading, analysis: false } }));
      return data.parsed;
    } catch (err: any) {
      set((s) => ({ error: err.response?.data?.error || "Failed to parse job description", loading: { ...s.loading, analysis: false } }));
      throw err;
    }
  },

  runGapAnalysisFromJD: async (roleTitle: string, requiredSkills: any[]) => {
    set((s) => ({ loading: { ...s.loading, analysis: true }, error: null }));
    try {
      const { data } = await api.post("/analysis/gap-from-jd", { roleTitle, requiredSkills });
      set((s) => ({
        analyses: [data.analysis, ...s.analyses],
        currentAnalysis: data.analysis,
        loading: { ...s.loading, analysis: false },
      }));
      return data.analysis;
    } catch (err: any) {
      set((s) => ({ error: err.response?.data?.error || "Analysis failed", loading: { ...s.loading, analysis: false } }));
      throw err;
    }
  },

  generateRoadmap: async (analysisId: string) => {
    set((s) => ({ loading: { ...s.loading, roadmap: true }, error: null }));
    try {
      const { data } = await api.post("/roadmap", { analysisId });
      set((s) => ({
        roadmaps: [data.roadmap, ...s.roadmaps],
        currentRoadmap: data.roadmap,
        loading: { ...s.loading, roadmap: false },
      }));
      return data.roadmap;
    } catch (err: any) {
      set((s) => ({ error: err.response?.data?.error || "Roadmap generation failed", loading: { ...s.loading, roadmap: false } }));
      throw err;
    }
  },

  generateInterviewQuestions: async (analysisId: string) => {
    set((s) => ({ loading: { ...s.loading, interview: true }, error: null }));
    try {
      const { data } = await api.post("/interview/questions", { analysisId });
      set((s) => ({
        interviewSets: [data.questions, ...s.interviewSets],
        currentInterview: data.questions,
        loading: { ...s.loading, interview: false },
      }));
      return data.questions;
    } catch (err: any) {
      set((s) => ({
        error: err.response?.data?.error || "Interview generation failed",
        loading: { ...s.loading, interview: false },
      }));
      throw err;
    }
  },

  addMoreInterviewQuestions: async (questionSetId: string, category?: string, focusSkills?: string[]) => {
    set((s) => ({ loading: { ...s.loading, interviewMore: true }, error: null }));
    try {
      const { data } = await api.post("/interview/questions/add-more", {
        questionSetId,
        category,
        focusSkills,
      });
      set((s) => ({
        interviewSets: s.interviewSets.map((q) =>
          q._id === questionSetId ? data.questions : q
        ),
        currentInterview: data.questions,
        loading: { ...s.loading, interviewMore: false },
      }));
      return data.questions;
    } catch (err: any) {
      set((s) => ({
        error: err.response?.data?.error || "Failed to add more questions",
        loading: { ...s.loading, interviewMore: false },
      }));
      throw err;
    }
  },

  fetchAnalyses: async () => {
    try {
      const { data } = await api.get("/analysis");
      set({ analyses: data.analyses });
    } catch {
      /* silent */
    }
  },

  fetchRoadmaps: async () => {
    try {
      const { data } = await api.get("/roadmap");
      set({ roadmaps: data.roadmaps });
    } catch {
      /* silent */
    }
  },

  fetchInterviewSets: async () => {
    try {
      const { data } = await api.get("/interview/questions");
      set({ interviewSets: data.questions });
    } catch {
      /* silent */
    }
  },

  setCurrentAnalysis: (a) => set({ currentAnalysis: a }),
  setCurrentRoadmap: (r) => set({ currentRoadmap: r }),
  setCurrentInterview: (i) => set({ currentInterview: i }),
  clearError: () => set({ error: null }),
}));
