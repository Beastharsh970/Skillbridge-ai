import { useEffect, useState } from "react";
import {
  Map, Clock, BookOpen, Code, ListChecks, ExternalLink,
  ChevronDown, ChevronUp, Sparkles, ArrowLeft, Layers, Timer,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import SkillBadge from "@/components/SkillBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/cn";
import type { Roadmap, RoadmapItem } from "@/types";

function RoadmapCard({ item, index }: { item: RoadmapItem; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  const levelColor = {
    beginner: "bg-green-500/10 text-green-600 dark:text-green-400",
    intermediate: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    advanced: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  const nodeColor = {
    beginner: "border-green-500 text-green-600 dark:text-green-400",
    intermediate: "border-amber-500 text-amber-600 dark:text-amber-400",
    advanced: "border-red-500 text-red-600 dark:text-red-400",
  };

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
      <div className="relative flex gap-4 pb-6">
        <div className={cn("relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-card text-sm font-bold", nodeColor[item.level])}>
          {index + 1}
        </div>
        <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{item.skill}</h3>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", levelColor[item.level])}>
                  {item.level}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.timeEstimate}</span>
                <span>{item.courses.length} courses</span>
                <span>{item.projects.length} projects</span>
              </div>
            </div>
            {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
          </button>
          {expanded && (
            <div className="border-t border-border p-5 space-y-5">
              {item.courses.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="h-4 w-4 text-primary" /> Recommended Courses
                  </div>
                  <div className="space-y-2">
                    {item.courses.map((c, i) => (
                      <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.platform}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", c.isFree ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
                            {c.isFree ? "Free" : "Paid"}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {item.projects.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Code className="h-4 w-4 text-primary" /> Practice Projects</div>
                  <div className="space-y-2">
                    {item.projects.map((p, i) => (
                      <div key={i} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{p.title}</span>
                          <SkillBadge name={p.difficulty} size="sm" />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {item.practiceTasks.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium"><ListChecks className="h-4 w-4 text-primary" /> Practice Tasks</div>
                  <ul className="space-y-1.5">
                    {item.practiceTasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const {
    currentAnalysis, currentRoadmap, roadmaps, generateRoadmap,
    fetchRoadmaps, fetchAnalyses, analyses, loading,
  } = useAppStore();

  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(currentRoadmap);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoadmaps();
    if (analyses.length === 0) fetchAnalyses();
  }, [fetchRoadmaps, fetchAnalyses, analyses.length]);

  useEffect(() => {
    if (currentRoadmap) setActiveRoadmap(currentRoadmap);
    else if (roadmaps.length > 0 && !activeRoadmap) setActiveRoadmap(roadmaps[0]);
  }, [currentRoadmap, roadmaps]);

  const handleGenerate = async () => {
    const analysisId = currentAnalysis?._id || analyses[0]?._id;
    if (!analysisId) { setError("Please run a gap analysis first."); return; }
    setError(null);
    try {
      const r = await generateRoadmap(analysisId);
      setActiveRoadmap(r);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate roadmap");
    }
  };

  const levelCounts = (r: Roadmap) => {
    const b = r.items.filter((i) => i.level === "beginner").length;
    const m = r.items.filter((i) => i.level === "intermediate").length;
    const a = r.items.filter((i) => i.level === "advanced").length;
    return { b, m, a };
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="animate-fade-in flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Roadmap</h1>
          <p className="mt-1 text-muted-foreground">
            AI-generated personalized learning path to close your skill gaps.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading.roadmap}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 shrink-0",
            loading.roadmap && "cursor-not-allowed opacity-70"
          )}
        >
          <Sparkles className="h-4 w-4" />
          {loading.roadmap ? "Generating..." : "Generate New"}
        </button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {/* Roadmap Selector — visible when multiple or no active */}
      {roadmaps.length > 0 && !activeRoadmap && !loading.roadmap && (
        <div className="animate-fade-in space-y-4">
          <h2 className="text-lg font-semibold">Your Roadmaps</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {roadmaps.map((r) => {
              const { b, m, a: adv } = levelCounts(r);
              return (
                <button
                  key={r._id}
                  onClick={() => setActiveRoadmap(r)}
                  className="card-hover group flex flex-col rounded-2xl border border-border bg-card overflow-hidden text-left"
                >
                  <div className="h-1.5 w-full flex">
                    {b > 0 && <div className="h-full bg-green-500" style={{ width: `${(b / r.items.length) * 100}%` }} />}
                    {m > 0 && <div className="h-full bg-amber-500" style={{ width: `${(m / r.items.length) * 100}%` }} />}
                    {adv > 0 && <div className="h-full bg-red-500" style={{ width: `${(adv / r.items.length) * 100}%` }} />}
                  </div>
                  <div className="p-5 flex-1">
                    <p className="font-semibold group-hover:text-primary transition-colors">{r.roleName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                      <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-primary" />{r.items.length} skills</span>
                      <span className="flex items-center gap-1.5"><Timer className="h-3.5 w-3.5 text-primary" />{r.totalEstimatedTime}</span>
                      <span className="capitalize">{r.experienceLevel}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {b > 0 && <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">{b} beginner</span>}
                      {m > 0 && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">{m} intermediate</span>}
                      {adv > 0 && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">{adv} advanced</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading.roadmap && <LoadingSpinner text="Gemini AI is building your personalized learning roadmap..." />}

      {/* Active Roadmap */}
      {activeRoadmap && !loading.roadmap && (
        <div className="animate-fade-in space-y-6">
          {roadmaps.length > 1 && (
            <button
              onClick={() => setActiveRoadmap(null)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to all roadmaps
            </button>
          )}

          {/* Summary */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="h-1.5 w-full flex">
              {(() => {
                const { b, m, a: adv } = levelCounts(activeRoadmap);
                const total = activeRoadmap.items.length || 1;
                return (<>
                  {b > 0 && <div className="h-full bg-green-500" style={{ width: `${(b / total) * 100}%` }} />}
                  {m > 0 && <div className="h-full bg-amber-500" style={{ width: `${(m / total) * 100}%` }} />}
                  {adv > 0 && <div className="h-full bg-red-500" style={{ width: `${(adv / total) * 100}%` }} />}
                </>);
              })()}
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Map className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{activeRoadmap.roleName} Roadmap</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{activeRoadmap.items.length} skills</span>
                    <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{activeRoadmap.totalEstimatedTime}</span>
                    <span className="capitalize">{activeRoadmap.experienceLevel} level</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            {activeRoadmap.items
              .sort((a, b) => a.order - b.order)
              .map((item, i) => (
                <RoadmapCard key={`${item.skill}-${i}`} item={item} index={i} />
              ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activeRoadmap && !loading.roadmap && roadmaps.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Map className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No roadmaps yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Run a gap analysis first, then generate your personalized roadmap.</p>
        </div>
      )}
    </div>
  );
}
