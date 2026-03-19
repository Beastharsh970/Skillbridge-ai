import { useState } from "react";
import {
  Github, CheckCircle2, Star, ExternalLink, AlertCircle,
  GitFork, Clock, Zap, Users, Code2, Tag, BarChart3,
  ArrowUpRight, Globe, BookOpen,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import SkillBadge from "@/components/SkillBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/cn";

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  "C++": "#f34b7d", "C#": "#178600", Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516",
  PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", HTML: "#e34c26",
  CSS: "#563d7c", SCSS: "#c6538c", Shell: "#89e051", Dockerfile: "#384d54", HCL: "#844FBA",
  C: "#555555", Lua: "#000080", Elixir: "#6e4a7e", Scala: "#c22d40", R: "#198CE7",
  Vue: "#41b883", Svelte: "#ff3e00",
};

export default function GitHubConnect() {
  const { user, fetchProfile } = useAuthStore();
  const { connectGitHub, loading } = useAppStore();
  const [username, setUsername] = useState(user?.githubUsername || "");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [repoTab, setRepoTab] = useState<"all" | "starred">("all");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError(null);
    try {
      const data = await connectGitHub(username.trim());
      setResult(data);
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to connect GitHub");
    }
  };

  const githubData = result?.githubData || user?.githubData;
  const totalLangs = githubData?.languages
    ? Object.values(githubData.languages as Record<string, number>).reduce(
        (a: number, b: number) => a + b, 0
      )
    : 0;

  const langEntries = githubData?.languages
    ? Object.entries(githubData.languages as Record<string, number>).sort(([, a], [, b]) => b - a)
    : [];

  const repos = githubData?.repos || [];
  const starredRepos = repos.filter((r: any) => r.stars > 0).sort((a: any, b: any) => b.stars - a.stars);
  const displayRepos = repoTab === "starred" ? starredRepos : repos;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">GitHub Integration</h1>
        <p className="mt-1 text-muted-foreground">
          Connect your GitHub to analyze repos, extract your real tech stack, and enrich your skill profile.
        </p>
      </div>

      {/* Connect Form */}
      <form
        onSubmit={handleConnect}
        className="animate-fade-in rounded-2xl border border-border bg-card p-6"
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Github className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your GitHub username"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading.github || !username.trim()}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90",
              (loading.github || !username.trim()) && "cursor-not-allowed opacity-70"
            )}
          >
            <Github className="h-4 w-4" />
            {loading.github ? "Analyzing..." : "Connect & Analyze"}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </form>

      {loading.github && <LoadingSpinner text="Scanning repositories, extracting dependencies, analyzing READMEs..." />}

      {githubData && !loading.github && (
        <div className="animate-fade-in space-y-6" style={{ animationDelay: "200ms" }}>

          {/* Profile Card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border text-2xl font-bold text-primary shadow-sm">
                  {(githubData.profile?.name || githubData.profile?.username || "G").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold">{githubData.profile?.name || githubData.profile?.username}</h2>
                    <a
                      href={githubData.profile?.profileUrl || `https://github.com/${username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      @{githubData.profile?.username || username}
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                  {githubData.profile?.bio && (
                    <p className="mt-1 text-sm text-muted-foreground">{githubData.profile.bio}</p>
                  )}
                </div>
                <div className="hidden sm:block">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-t border-border">
              {[
                { icon: GitFork, value: githubData.stats?.totalRepos || 0, label: "Repositories", color: "text-primary" },
                { icon: Star, value: githubData.stats?.totalStars || 0, label: "Stars Earned", color: "text-amber-500" },
                { icon: Zap, value: githubData.stats?.recentlyActive || 0, label: "Active (6mo)", color: "text-green-500" },
                { icon: Clock, value: `${githubData.profile?.accountAgeYears || 0}yr`, label: "On GitHub", color: "text-purple-500" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex flex-col items-center py-4 px-2">
                    <Icon className={cn("h-4 w-4 mb-1", stat.color)} />
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detected Skills */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Detected Skills
              </h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {(githubData.skills || []).length} found
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(githubData.skills || []).map((skill: string) => (
                <SkillBadge key={skill} name={skill} variant="success" />
              ))}
              {(githubData.skills || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No skills detected. Try adding repo topics on GitHub.</p>
              )}
            </div>
          </div>

          {/* Topics */}
          {(githubData.topics || []).length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-3 font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Repository Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {(githubData.topics || []).map((topic: string) => (
                  <span
                    key={topic}
                    className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Language Distribution */}
          {langEntries.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Language Distribution
              </h3>

              {/* Stacked bar */}
              <div className="mb-5 flex h-4 overflow-hidden rounded-full bg-muted">
                {langEntries.slice(0, 8).map(([lang, bytes]) => {
                  const pct = (bytes / totalLangs) * 100;
                  if (pct < 1) return null;
                  return (
                    <div
                      key={lang}
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: LANG_COLORS[lang] || "#666",
                      }}
                      title={`${lang}: ${Math.round(pct)}%`}
                    />
                  );
                })}
              </div>

              {/* Legend + bars */}
              <div className="grid gap-3 sm:grid-cols-2">
                {langEntries.slice(0, 10).map(([lang, bytes]) => {
                  const pct = Math.round((bytes / totalLangs) * 100);
                  const color = LANG_COLORS[lang] || "#666";
                  return (
                    <div key={lang} className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="flex-1 text-sm font-medium">{lang}</span>
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Repositories */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Repositories
              </h3>
              <div className="flex gap-1 rounded-lg border border-border bg-muted p-0.5">
                <button
                  onClick={() => setRepoTab("all")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-all",
                    repoTab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  All ({repos.length})
                </button>
                <button
                  onClick={() => setRepoTab("starred")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-all",
                    repoTab === "starred" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Star className="mr-1 inline h-3 w-3" />
                  Starred ({starredRepos.length})
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {displayRepos.slice(0, 12).map((repo: any) => {
                const langColor = LANG_COLORS[repo.language] || "#666";
                return (
                  <a
                    key={repo.name}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group card-hover rounded-xl border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-primary truncate group-hover:underline">
                          {repo.name}
                        </p>
                        {repo.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      {repo.language && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: langColor }} />
                          {repo.language}
                        </span>
                      )}
                      {repo.stars > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-500">
                          <Star className="h-3 w-3" />
                          {repo.stars}
                        </span>
                      )}
                      {repo.size > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {repo.size > 1024 ? `${(repo.size / 1024).toFixed(1)} MB` : `${repo.size} KB`}
                        </span>
                      )}
                    </div>

                    {(repo.topics || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {repo.topics.slice(0, 4).map((t: string) => (
                          <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                            {t}
                          </span>
                        ))}
                        {repo.topics.length > 4 && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                            +{repo.topics.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </a>
                );
              })}
            </div>

            {displayRepos.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {repoTab === "starred" ? "No starred repositories found." : "No repositories found."}
              </p>
            )}
          </div>

          {/* Footer link */}
          <div className="text-center">
            <a
              href={githubData.profile?.profileUrl || `https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="h-4 w-4" />
              View full profile on GitHub
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
