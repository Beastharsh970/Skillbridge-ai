import { create } from "zustand";
import api from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, experienceLevel?: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Login failed",
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (name, email, password, experienceLevel) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        experienceLevel,
      });
      localStorage.setItem("token", data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Registration failed",
        isLoading: false,
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get("/auth/profile");
      set({ user: data.user });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  },

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));
