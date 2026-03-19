import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Github,
  Target,
  Map,
  MessageSquare,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import SkillBadge from "@/components/SkillBadge";
import ScoreIndicator from "@/components/ScoreIndicator";
import { cn } from "@/lib/cn";

export default function Dashboard() {
  const { user, fetchProfile } = useAuthStore();
  const { analyses, fetchAnalyses } = useAppStore();

  useEffect(() => {
    fetchProfile();
    fetchAnalyses();
  }, [fetchProfile, fetchAnalyses]);

  const latestAnalysis = analyses[0];

  const steps = [
    {
      label: "Upload Resume",
      path: "/resume",
      done: !!user?.resumeParsed,
      icon: FileText,
    },
    {
      label: "Connect GitHub",
      path: "/github",
      done: !!user?.githubData,
      icon: Github,
    },
    {
      label: "Run Gap Analysis",
      path: "/analysis",
      done: analyses.length > 0,
      icon: Target,
    },
    {
      label: "View Roadmap",
      path: "/roadmap",
      done: false,
      icon: Map,
    },
    {
      label: "Practice Interviews",
      path: "/interview",
      done: false,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="text-primary">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s an overview of your career navigation progress.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="animate-fade-in rounded-2xl border border-border bg-card p-6" style={{ animationDelay: "100ms" }}>
        <h2 className="mb-4 text-lg font-semibold">Your Progress</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.label}
                to={step.path}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-primary/30 hover:shadow-sm",
                  step.done
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border"
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skills overview */}
        <div className="animate-fade-in rounded-2xl border border-border bg-card p-6" style={{ animationDelay: "200ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Skills</h2>
            <span className="text-sm text-muted-foreground">
              {user?.skills?.length || 0} detected
            </span>
          </div>
          {user?.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <SkillBadge key={skill} name={skill} variant="primary" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Upload your resume or connect GitHub to discover your skills
              </p>
              <Link
                to="/resume"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Upload Resume <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Latest Analysis */}
        <div className="animate-fade-in rounded-2xl border border-border bg-card p-6" style={{ animationDelay: "300ms" }}>
          <h2 className="mb-4 text-lg font-semibold">Latest Analysis</h2>
          {latestAnalysis ? (
            <div className="flex flex-col items-center gap-4">
              <ScoreIndicator
                score={latestAnalysis.readinessScore}
                size="lg"
                label="Readiness Score"
              />
              <p className="text-sm font-medium">
                Target: <span className="text-primary">{latestAnalysis.roleName}</span>
              </p>
              <div className="flex gap-4 text-center text-sm">
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {latestAnalysis.strengths.length}
                  </p>
                  <p className="text-muted-foreground">Strengths</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">
                    {latestAnalysis.missingSkills.length}
                  </p>
                  <p className="text-muted-foreground">Gaps</p>
                </div>
              </div>
              <Link
                to="/analysis"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View Full Analysis <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Run a gap analysis to see your readiness score
              </p>
              <Link
                to="/analysis"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Start Analysis <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in grid gap-4 sm:grid-cols-3" style={{ animationDelay: "400ms" }}>
        {[
          { to: "/analysis", icon: Target, label: "New Gap Analysis", color: "bg-primary/10 text-primary" },
          { to: "/roadmap", icon: Map, label: "View Roadmap", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
          { to: "/interview", icon: MessageSquare, label: "Practice Interview", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.to}
              className="card-hover flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", action.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-medium">{action.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
