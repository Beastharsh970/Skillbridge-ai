import { Link } from "react-router-dom";
import { ArrowRight, Target, Map, MessageSquare, FileText, Github, Zap } from "lucide-react";
import { ThemeToggle } from "@/theme/ThemeToggle";

const features = [
  {
    icon: FileText,
    title: "Resume Analysis",
    description: "Upload your resume and our AI extracts skills, projects, and experience automatically.",
  },
  {
    icon: Github,
    title: "GitHub Integration",
    description: "Connect your GitHub to reveal your actual tech stack from real projects.",
  },
  {
    icon: Target,
    title: "AI Gap Analysis",
    description: "Powered by Google Gemini, get a detailed breakdown of skill gaps and a readiness score.",
  },
  {
    icon: Map,
    title: "Learning Roadmap",
    description: "Receive a personalized roadmap with courses, projects, and practice tasks.",
  },
  {
    icon: MessageSquare,
    title: "Mock Interviews",
    description: "AI-generated technical, behavioral, and coding questions tailored to your target role.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">SkillBridge</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="gradient-overlay absolute inset-0" />
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-3.5 w-3.5" />
              Powered by Google Gemini AI
            </div>
            <h1 className="animate-fade-in text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Bridge the Gap Between
              <span className="mt-2 block bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                Where You Are & Where You Want to Be
              </span>
            </h1>
            <p className="animate-fade-in mt-6 text-lg text-muted-foreground sm:text-xl" style={{ animationDelay: "150ms" }}>
              Upload your resume, connect GitHub, pick your target role — and let AI
              analyze your gaps, build a learning roadmap, and prepare you for interviews.
            </p>
            <div className="animate-fade-in mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center" style={{ animationDelay: "300ms" }}>
              <Link
                to="/register"
                className="btn-glow inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl"
              >
                Start Your Journey
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-base font-medium transition-all hover:bg-accent"
              >
                I Have an Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Everything You Need to Level Up</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete AI-powered toolkit for career advancement in tech.
            </p>
          </div>
          <div className="stagger-children grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="card-hover rounded-2xl border border-border bg-card p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">Ready to Navigate Your Career?</h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of developers using AI to accelerate their career growth.
          </p>
          <Link
            to="/register"
            className="btn-glow mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SkillBridge Career Navigator. Built with Gemini AI.
        </div>
      </footer>
    </div>
  );
}
