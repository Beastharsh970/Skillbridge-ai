import { useEffect, useState } from "react";
import {
  MessageSquare, Code, Users, Brain, ChevronDown, ChevronUp,
  Lightbulb, Sparkles, Plus, X, ArrowLeft, Clock,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import SkillBadge from "@/components/SkillBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/cn";
import type { InterviewQuestions } from "@/types";

function QuestionCard({
  question, answer, index, difficulty, tag, hints,
}: {
  question: string; answer?: string; index: number; difficulty?: string; tag?: string; hints?: string[];
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const diffColor = {
    easy: "bg-green-500/10 text-green-600 dark:text-green-400",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    hard: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
          {difficulty && (
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", diffColor[difficulty as keyof typeof diffColor] || "bg-secondary text-secondary-foreground")}>{difficulty}</span>
          )}
          {tag && <SkillBadge name={tag} size="sm" variant="primary" />}
        </div>
        <p className="text-sm font-medium leading-relaxed">{question}</p>
      </div>
      {(answer || (hints && hints.length > 0)) && (
        <>
          <button onClick={() => setShowAnswer(!showAnswer)} className="flex w-full items-center justify-between border-t border-border px-5 py-3 text-sm font-medium text-primary hover:bg-accent/50 transition-colors">
            <span className="flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5" />{showAnswer ? "Hide" : "Show"} {hints ? "Hints" : "Answer"}</span>
            {showAnswer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showAnswer && (
            <div className="border-t border-border bg-muted/30 p-5">
              {answer && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{answer}</p>}
              {hints && hints.length > 0 && (
                <ul className="space-y-1.5">
                  {hints.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function InterviewPrep() {
  const {
    currentAnalysis, currentInterview, interviewSets, generateInterviewQuestions,
    addMoreInterviewQuestions, fetchInterviewSets, fetchAnalyses, analyses, loading,
  } = useAppStore();

  const [activeSet, setActiveSet] = useState<InterviewQuestions | null>(currentInterview);
  const [activeTab, setActiveTab] = useState<"technical" | "behavioral" | "coding">("technical");
  const [error, setError] = useState<string | null>(null);
  const [showAddMore, setShowAddMore] = useState(false);
  const [addCategory, setAddCategory] = useState<"all" | "technical" | "behavioral" | "coding">("all");
  const [focusSkillInput, setFocusSkillInput] = useState("");
  const [focusSkills, setFocusSkills] = useState<string[]>([]);
  const [addingMore, setAddingMore] = useState(false);

  useEffect(() => {
    fetchInterviewSets();
    if (analyses.length === 0) fetchAnalyses();
  }, [fetchInterviewSets, fetchAnalyses, analyses.length]);

  useEffect(() => {
    if (currentInterview) setActiveSet(currentInterview);
    else if (interviewSets.length > 0 && !activeSet) setActiveSet(interviewSets[0]);
  }, [currentInterview, interviewSets]);

  const handleGenerate = async () => {
    const analysisId = currentAnalysis?._id || analyses[0]?._id;
    if (!analysisId) { setError("Please run a gap analysis first."); return; }
    setError(null);
    try {
      const q = await generateInterviewQuestions(analysisId);
      setActiveSet(q);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate questions");
    }
  };

  const handleAddMore = async () => {
    if (!activeSet) return;
    setAddingMore(true);
    setError(null);
    try {
      const category = addCategory === "all" ? undefined : addCategory;
      const skills = focusSkills.length > 0 ? focusSkills : undefined;
      const updated = await addMoreInterviewQuestions(activeSet._id, category, skills);
      setActiveSet(updated);
      setShowAddMore(false);
      setFocusSkills([]);
      setFocusSkillInput("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add more questions");
    } finally {
      setAddingMore(false);
    }
  };

  const addFocusSkill = () => {
    const val = focusSkillInput.trim();
    if (val && !focusSkills.includes(val)) { setFocusSkills([...focusSkills, val]); setFocusSkillInput(""); }
  };

  const tabs = [
    { id: "technical" as const, label: "Technical", icon: Brain, count: activeSet?.technical.length || 0 },
    { id: "behavioral" as const, label: "Behavioral", icon: Users, count: activeSet?.behavioral.length || 0 },
    { id: "coding" as const, label: "Coding", icon: Code, count: activeSet?.coding.length || 0 },
  ];

  const getTotal = (s: InterviewQuestions) => s.technical.length + s.behavioral.length + s.coding.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="animate-fade-in flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Interview Prep</h1>
          <p className="mt-1 text-muted-foreground">
            AI-generated mock interview questions tailored to your target role.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading.interview}
          className={cn("inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shrink-0", loading.interview && "cursor-not-allowed opacity-70")}
        >
          <Sparkles className="h-4 w-4" />
          {loading.interview && !addingMore ? "Generating..." : "Generate New"}
        </button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {/* Session Selector — visible when no active set or multiple exist */}
      {interviewSets.length > 0 && !activeSet && !loading.interview && (
        <div className="animate-fade-in space-y-4">
          <h2 className="text-lg font-semibold">Your Interview Sessions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {interviewSets.map((s) => {
              const total = getTotal(s);
              return (
                <button
                  key={s._id}
                  onClick={() => { setActiveSet(s); setShowAddMore(false); }}
                  className="card-hover group flex flex-col rounded-2xl border border-border bg-card overflow-hidden text-left"
                >
                  <div className="h-1.5 w-full flex">
                    <div className="h-full bg-blue-500" style={{ width: `${(s.technical.length / total) * 100}%` }} />
                    <div className="h-full bg-purple-500" style={{ width: `${(s.behavioral.length / total) * 100}%` }} />
                    <div className="h-full bg-amber-500" style={{ width: `${(s.coding.length / total) * 100}%` }} />
                  </div>
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold group-hover:text-primary transition-colors">{s.roleName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-primary">{total}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                      <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5 text-blue-500" />{s.technical.length} technical</span>
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-purple-500" />{s.behavioral.length} behavioral</span>
                      <span className="flex items-center gap-1.5"><Code className="h-3.5 w-3.5 text-amber-500" />{s.coding.length} coding</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading.interview && !addingMore && <LoadingSpinner text="Gemini AI is preparing your mock interview questions..." />}

      {/* Active Set */}
      {activeSet && !loading.interview && (
        <div className="animate-fade-in space-y-6">
          {interviewSets.length > 1 && (
            <button
              onClick={() => { setActiveSet(null); setShowAddMore(false); }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to all sessions
            </button>
          )}

          {/* Header Card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="h-1.5 w-full flex">
              {(() => {
                const total = getTotal(activeSet);
                return (<>
                  <div className="h-full bg-blue-500" style={{ width: `${(activeSet.technical.length / total) * 100}%` }} />
                  <div className="h-full bg-purple-500" style={{ width: `${(activeSet.behavioral.length / total) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${(activeSet.coding.length / total) * 100}%` }} />
                </>);
              })()}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                  <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{activeSet.roleName} Interview</h2>
                  <p className="text-sm text-muted-foreground">{getTotal(activeSet)} questions across 3 categories</p>
                </div>
                <button
                  onClick={() => setShowAddMore(!showAddMore)}
                  className={cn("inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all", showAddMore ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30 hover:bg-accent")}
                >
                  <Plus className="h-4 w-4" /> Add More
                </button>
              </div>
              {activeSet.targetSkills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {activeSet.targetSkills.map((s) => <SkillBadge key={s} name={s} size="sm" variant="primary" />)}
                </div>
              )}
            </div>
          </div>

          {/* Add More Panel */}
          {showAddMore && (
            <div className="animate-fade-in rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Add More Questions</h3>
                <button onClick={() => setShowAddMore(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {([{ id: "all", label: "All" }, { id: "technical", label: "Technical" }, { id: "behavioral", label: "Behavioral" }, { id: "coding", label: "Coding" }] as const).map((opt) => (
                    <button key={opt.id} onClick={() => setAddCategory(opt.id as any)} className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium transition-all", addCategory === opt.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Focus skills (optional)</label>
                {focusSkills.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {focusSkills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {s}<button onClick={() => setFocusSkills(focusSkills.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" value={focusSkillInput} onChange={(e) => setFocusSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFocusSkill())} placeholder="e.g. React, SQL..." className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                  <button onClick={addFocusSkill} disabled={!focusSkillInput.trim()} className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">Add</button>
                </div>
              </div>
              <button onClick={handleAddMore} disabled={addingMore} className={cn("inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90", addingMore && "opacity-70 cursor-not-allowed")}>
                <Sparkles className="h-4 w-4" /> {addingMore ? "Generating..." : "Generate & Add"}
              </button>
              {addingMore && <p className="text-xs text-muted-foreground animate-pulse">Generating additional questions...</p>}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all", activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="h-4 w-4" />{tab.label}
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {activeTab === "technical" && activeSet.technical.map((q, i) => <QuestionCard key={`t-${i}`} question={q.question} answer={q.expectedAnswer} index={i} difficulty={q.difficulty} tag={q.skill} />)}
            {activeTab === "behavioral" && activeSet.behavioral.map((q, i) => <QuestionCard key={`b-${i}`} question={q.question} answer={q.tip} index={i} tag={q.category} />)}
            {activeTab === "coding" && activeSet.coding.map((q, i) => <QuestionCard key={`c-${i}`} question={q.question} hints={q.hints} index={i} difficulty={q.difficulty} tag={q.relatedSkill} />)}
          </div>

          <div className="flex justify-center pt-2">
            <button onClick={() => { setShowAddMore(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary">
              <Plus className="h-4 w-4" /> Want more questions? Click to add
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activeSet && !loading.interview && interviewSets.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No interview sets yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Run a gap analysis first, then generate mock interview questions.</p>
        </div>
      )}
    </div>
  );
}
