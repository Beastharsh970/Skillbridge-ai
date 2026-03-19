import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { useAuthStore } from "@/stores/authStore";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import ResumeUpload from "@/pages/ResumeUpload";
import GitHubConnect from "@/pages/GitHubConnect";
import GapAnalysis from "@/pages/GapAnalysis";
import RoadmapPage from "@/pages/RoadmapPage";
import InterviewPrep from "@/pages/InterviewPrep";
import AiChat from "@/pages/AiChat";

function AuthInit({ children }: { children: React.ReactNode }) {
  const { token, fetchProfile, user } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
  }, [token, user, fetchProfile]);

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <BrowserRouter>
        <AuthInit>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/resume" element={<ResumeUpload />} />
              <Route path="/github" element={<GitHubConnect />} />
              <Route path="/analysis" element={<GapAnalysis />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/interview" element={<InterviewPrep />} />
              <Route path="/chat" element={<AiChat />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthInit>
      </BrowserRouter>
    </ThemeProvider>
  );
}
