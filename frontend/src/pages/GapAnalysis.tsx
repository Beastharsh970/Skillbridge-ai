import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target, AlertCircle, TrendingUp, TrendingDown, Lightbulb,
  ArrowRight, Map, MessageSquare, Plus, ClipboardPaste, Sparkles,
  ChevronDown, ChevronUp, X, Briefcase, BarChart3, Shield,
  Clock, Award, ArrowLeft, CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useAuthStore } from "@/stores/authStore";
import ScoreIndicator from "@/components/ScoreIndicator";
import SkillBadge from "@/components/SkillBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Role, Analysis } from "@/types";
import { cn } from "@/lib/cn";

function SkillBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs font-medium truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

export default function GapAnalysis() {
  const {
    roles, fetchRoles, runGapAnalysis, parseJobDescription, runGapAnalysisFromJD,
    analyses, fetchAnalyses, loading, setCurrentAnalysis,
  } = useAppStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<Analysis | null>(null);
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const [mode, setMode] = useState<"role" | "jd">("role");

  const [jdText, setJdText] = useState("");
  const [parsedJD, setParsedJD] = useState<any>(null);
  const [parsingJD, setParsingJD] = useState(false);
  const [expandedRanking, setExpandedRanking] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchAnalyses();
  }, [fetchRoles, fetchAnalyses]);

  useEffect(() => {
    if (analyses.length === 0) setShowNewAnalysis(true);
  }, [analyses.length]);

  const handleAnalyze = async () => {
    if (!selectedRole) return;
    setError(null);
    try {
      const analysis = await runGapAnalysis(selectedRole);
      setActiveAnalysis(analysis);
      setShowNewAnalysis(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Analysis failed. Upload a resume or connect GitHub first.");
    }
  };

  const handleParseJD = async () => {
    if (jdText.trim().length < 20) { setError("Paste a longer job description."); return; }
    setParsingJD(true);
    setError(null);
    try {
      const parsed = await parseJobDescription(jdText);
      setParsedJD(parsed);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to parse job description");
    } finally {
      setParsingJD(false);
    }
  };

  const handleAnalyzeJD = async () => {
    if (!parsedJD) return;
    setError(null);
    try {
      const analysis = await runGapAnalysisFromJD(parsedJD.roleTitle, parsedJD.requiredSkills);
      setActiveAnalysis(analysis);
      setShowNewAnalysis(false);
      setParsedJD(null);
      setJdText("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Analysis failed.");
    }
  };

  const viewAnalysis = (a: Analysis) => {
    setActiveAnalysis(a);
    setCurrentAnalysis(a);
    setShowNewAnalysis(false);
  };

  const importanceVariant = (imp: string) => {
    if (imp === "high") return "danger";
    if (imp === "medium") return "warning";
    return "default";
  };

  const a = activeAnalysis;
  const scoreColor = (s: number) =>
    s >= 75 ? "text-green-500" : s >= 50 ? "text-amber-500" : "text-red-500";
  const scoreBg = (s: number) =>
    s >= 75 ? "from-green-500/10" : s >= 50 ? "from-amber-500/10" : "from-red-500/10";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="animate-fade-in flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Gap Analysis</h1>
          <p className="mt-1 text-muted-foreground">
            Compare your skills against a target role or any job posting.
          </p>
        </div>
        <button
          onClick={() => { setShowNewAnalysis(!showNewAnalysis); setActiveAnalysis(null); }}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all shrink-0",
            showNewAnalysis
              ? "border border-border bg-card hover:bg-accent"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {showNewAnalysis ? <><ChevronUp className="h-4 w-4" /> Close</> : <><Plus className="h-4 w-4" /> New Analysis</>}
        </button>
      </div>

      {!user?.resumeParsed && !user?.githubData && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Upload your resume or connect GitHub first for a better analysis.
        </div>
      )}

      {/* Previous Analyses Grid */}
      {analyses.length > 0 && !activeAnalysis && !showNewAnalysis && (
        <div className="animate-fade-in space-y-4">
          <h2 className="text-lg font-semibold">Your Analyses</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((item) => {
              const sc = item.readinessScore;
              return (
                <button
                  key={item._id}
                  onClick={() => viewAnalysis(item)}
                  className="card-hover group flex flex-col rounded-2xl border border-border bg-card overflow-hidden text-left"
                >
                  <div className={cn("h-1.5 w-full bg-gradient-to-r to-transparent", scoreBg(sc))} />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate group-hover:text-primary transition-colors">{item.roleName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-bold", scoreColor(sc))}>{sc}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Score</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        {item.strengths.length} strengths
                      </span>
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        {item.missingSkills.length} gaps
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                        {item.suggestions.length} tips
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* New Analysis Panel */}
      {showNewAnalysis && (
        <div className="animate-fade-in space-y-4">
          <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
            <button
              onClick={() => setMode("role")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                mode === "role" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Briefcase className="h-4 w-4" /> Select a Role
            </button>
            <button
              onClick={() => setMode("jd")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                mode === "jd" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ClipboardPaste className="h-4 w-4" /> Paste Job Description
            </button>
          </div>

          {mode === "role" && (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-semibold">Select Target Role</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roles.map((role: Role) => (
                  <button
                    key={role._id}
                    onClick={() => setSelectedRole(role._id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      selectedRole === role._id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{role.title}</span>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0", role.demandLevel === "high" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-amber-500/10 text-amber-600")}>
                        {role.demandLevel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{role.description}</p>
                  </button>
                ))}
              </div>
              <button onClick={handleAnalyze} disabled={!selectedRole || loading.analysis} className={cn("inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90", (!selectedRole || loading.analysis) && "cursor-not-allowed opacity-70")}>
                <Target className="h-4 w-4" />
                {loading.analysis ? "Analyzing..." : "Run Gap Analysis"}
              </button>
            </div>
          )}

          {mode === "jd" && (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-semibold">Paste a Job Description</h2>
              <p className="text-sm text-muted-foreground">
                Copy-paste from LinkedIn, Indeed, or any job board. AI will extract requirements and compare against your profile.
              </p>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={8}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none resize-y focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex items-center gap-3">
                <button onClick={handleParseJD} disabled={jdText.trim().length < 20 || parsingJD || loading.analysis} className={cn("inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90", (jdText.trim().length < 20 || parsingJD || loading.analysis) && "cursor-not-allowed opacity-70")}>
                  <Sparkles className="h-4 w-4" />
                  {parsingJD ? "Extracting..." : "Extract & Analyze"}
                </button>
                {jdText.length > 0 && <button onClick={() => { setJdText(""); setParsedJD(null); }} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>}
              </div>
              {parsingJD && <LoadingSpinner text="AI is extracting skills and requirements..." />}
              {parsedJD && !parsingJD && (
                <div className="animate-fade-in space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{parsedJD.roleTitle}</h3>
                      {parsedJD.company && <p className="text-sm text-muted-foreground">{parsedJD.company}</p>}
                      <p className="mt-1 text-sm text-muted-foreground">{parsedJD.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Level: <span className="capitalize font-medium">{parsedJD.experienceLevel}</span> · {parsedJD.requiredSkills?.length || 0} skills
                      </p>
                    </div>
                    <button onClick={() => setParsedJD(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(parsedJD.requiredSkills || []).map((s: any, i: number) => (
                      <SkillBadge key={`${s.name}-${i}`} name={s.name} variant={s.priority === "essential" ? "danger" : s.priority === "important" ? "warning" : "default"} size="sm" />
                    ))}
                  </div>
                  <button onClick={handleAnalyzeJD} disabled={loading.analysis} className={cn("inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90", loading.analysis && "cursor-not-allowed opacity-70")}>
                    <Target className="h-4 w-4" />
                    {loading.analysis ? "Running Analysis..." : "Run Gap Analysis Against This"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {loading.analysis && !parsingJD && <LoadingSpinner text="Gemini AI is analyzing your skill gap... This may take a moment." />}

      {/* ══════════════════════════════════════════════════════
          ANALYSIS RESULTS — redesigned
         ══════════════════════════════════════════════════════ */}
      {a && !loading.analysis && (
        <div className="animate-fade-in space-y-6">
          {analyses.length > 1 && (
            <button
              onClick={() => { setActiveAnalysis(null); setShowNewAnalysis(false); }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to all analyses
            </button>
          )}

          {/* Hero Score Card */}
          <div className={cn("rounded-2xl border border-border bg-card overflow-hidden")}>
            <div className={cn("bg-gradient-to-r to-transparent px-8 py-2", scoreBg(a.readinessScore))} />
            <div className="p-8">
              <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
                <ScoreIndicator score={a.readinessScore} size="lg" label="Readiness Score" />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold">{a.roleName}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Analyzed on {new Date(a.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>

                  {/* Quick stats */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[
                      { icon: CheckCircle2, label: `${a.strengths.length} Strengths`, color: "text-green-500 bg-green-500/10" },
                      { icon: AlertCircle, label: `${a.missingSkills.length} Gaps`, color: "text-red-500 bg-red-500/10" },
                      { icon: Lightbulb, label: `${a.suggestions.length} Suggestions`, color: "text-amber-500 bg-amber-500/10" },
                      { icon: BarChart3, label: `${a.skillImportanceRanking.length} Ranked`, color: "text-primary bg-primary/10" },
                    ].map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", stat.color)}>
                          <Icon className="h-3.5 w-3.5" /> {stat.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Feedback */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-3 font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Personalized Feedback
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {a.personalizedFeedback}
            </p>
          </div>

          {/* Strengths + Gaps side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Strengths */}
            <div className="rounded-2xl border border-green-500/20 bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-green-500/10 bg-green-500/5 px-6 py-3">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <h3 className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Your Strengths ({a.strengths.length})
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {a.strengths.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-green-500/5 transition-colors">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-[10px] font-bold text-green-600 dark:text-green-400">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium">{s.name}</span>
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                      {s.proficiencyEstimate}
                    </span>
                  </div>
                ))}
                {a.strengths.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No matching strengths detected</p>}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="rounded-2xl border border-red-500/20 bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-red-500/10 bg-red-500/5 px-6 py-3">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Missing Skills ({a.missingSkills.length})
                </h3>
              </div>
              <div className="p-4">
                {/* Group by importance */}
                {(["high", "medium", "low"] as const).map((level) => {
                  const skills = a.missingSkills.filter((s) => s.importance === level);
                  if (skills.length === 0) return null;
                  const labels = { high: "Critical", medium: "Important", low: "Nice to Have" };
                  const colors = { high: "text-red-500", medium: "text-amber-500", low: "text-muted-foreground" };
                  return (
                    <div key={level} className="mb-3 last:mb-0">
                      <p className={cn("mb-2 text-[10px] font-semibold uppercase tracking-wider", colors[level])}>
                        {labels[level]} ({skills.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s) => (
                          <SkillBadge key={s.name} name={s.name} variant={importanceVariant(level)} size="sm" />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {a.missingSkills.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No missing skills — you're fully qualified!</p>}
              </div>
            </div>
          </div>

          {/* Skill Coverage Overview */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Skill Coverage
            </h3>
            <div className="space-y-2.5">
              <SkillBar label="Strengths" value={a.strengths.length} max={a.strengths.length + a.missingSkills.length} color="bg-green-500" />
              <SkillBar label="Missing (Critical)" value={a.missingSkills.filter((s) => s.importance === "high").length} max={a.missingSkills.length || 1} color="bg-red-500" />
              <SkillBar label="Missing (Important)" value={a.missingSkills.filter((s) => s.importance === "medium").length} max={a.missingSkills.length || 1} color="bg-amber-500" />
              <SkillBar label="Missing (Nice to Have)" value={a.missingSkills.filter((s) => s.importance === "low").length} max={a.missingSkills.length || 1} color="bg-muted-foreground/40" />
            </div>
          </div>

          {/* Learning Priority Ranking */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Learning Priority Ranking
              </h3>
              {a.skillImportanceRanking.length > 5 && (
                <button
                  onClick={() => setExpandedRanking(!expandedRanking)}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {expandedRanking ? "Show less" : `Show all ${a.skillImportanceRanking.length}`}
                  {expandedRanking ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
            </div>
            <div className="divide-y divide-border">
              {a.skillImportanceRanking.slice(0, expandedRanking ? undefined : 5).map((item, i) => (
                <div key={item.skill} className="flex items-start gap-4 px-6 py-4 hover:bg-accent/30 transition-colors">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    i === 0 ? "bg-primary text-primary-foreground" :
                    i === 1 ? "bg-primary/20 text-primary" :
                    i === 2 ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {item.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.skill}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
                  </div>
                  {i < 3 && (
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      i === 0 ? "bg-red-500/10 text-red-500" :
                      i === 1 ? "bg-amber-500/10 text-amber-500" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {i === 0 ? "Top Priority" : i === 1 ? "High" : "Medium"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Suggestions */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Actionable Suggestions
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {a.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-500">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => { setCurrentAnalysis(a); navigate("/roadmap"); }}
              className="card-hover group flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <Map className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold">Generate Learning Roadmap</span>
                <p className="text-xs text-muted-foreground">Personalized plan to close your skill gaps</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <button
              onClick={() => { setCurrentAnalysis(a); navigate("/interview"); }}
              className="card-hover group flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold">Practice Mock Interview</span>
                <p className="text-xs text-muted-foreground">AI-tailored questions for this role</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {analyses.length === 0 && !showNewAnalysis && !loading.analysis && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Target className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No analyses yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Click "New Analysis" to get started.</p>
        </div>
      )}
    </div>
  );
}
