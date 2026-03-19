import { useState, useCallback } from "react";
import {
  Upload, FileText, CheckCircle2, AlertCircle, X, GraduationCap,
  Award, Briefcase, Clock, Pencil, Save, Plus, Trash2,
  Sparkles, Download, Eye, ChevronDown, ChevronUp, Replace,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import SkillBadge from "@/components/SkillBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/cn";

function EditableTagList({
  tags,
  onChange,
  variant = "primary",
  placeholder = "Add item...",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  variant?: "primary" | "success" | "warning" | "default";
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const value = input.trim();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
      setInput("");
    }
  };

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
              variant === "primary" && "bg-primary/10 text-primary",
              variant === "success" && "bg-green-500/10 text-green-600 dark:text-green-400",
              variant === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              variant === "default" && "bg-secondary text-secondary-foreground"
            )}
          >
            {tag}
            <button onClick={() => remove(tag)} className="hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

export default function ResumeUpload() {
  const { user, fetchProfile } = useAuthStore();
  const { uploadResume, updateResumeData, improveResume, downloadImprovedResume, loading } = useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [improvedData, setImprovedData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editSoftSkills, setEditSoftSkills] = useState<string[]>([]);
  const [editCerts, setEditCerts] = useState<string[]>([]);
  const [editDomains, setEditDomains] = useState<string[]>([]);
  const [editYoe, setEditYoe] = useState<string>("");
  const [editEducation, setEditEducation] = useState<{ degree: string; institution: string; year: string }[]>([]);
  const [editExperience, setEditExperience] = useState<{ title: string; company: string; duration: string; description: string; skills: string[] }[]>([]);

  const parsed = result?.parsed || user?.resumeParsed;

  const startEditing = () => {
    if (!parsed) return;
    setEditSkills([...(parsed.skills || [])]);
    setEditSoftSkills([...(parsed.softSkills || [])]);
    setEditCerts([...(parsed.certifications || [])]);
    setEditDomains([...(parsed.domains || [])]);
    setEditYoe(parsed.yearsOfExperience != null ? String(parsed.yearsOfExperience) : "");
    setEditEducation((parsed.education || []).map((e: any) => ({ ...e })));
    setEditExperience((parsed.experience || []).map((e: any) => ({ ...e, skills: [...(e.skills || [])] })));
    setEditing(true);
  };

  const saveEdits = async () => {
    setError(null);
    try {
      await updateResumeData({
        skills: editSkills,
        softSkills: editSoftSkills,
        certifications: editCerts,
        domains: editDomains,
        yearsOfExperience: editYoe ? Number(editYoe) : null,
        education: editEducation,
        experience: editExperience,
      });
      await fetchProfile();
      setEditing(false);
      setResult(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save changes");
    }
  };

  const handleImprove = async () => {
    setError(null);
    try {
      const data = await improveResume(targetRole || undefined);
      setImprovedData(data);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to improve resume");
    }
  };

  const handleDownload = async () => {
    if (!improvedData) return;
    setDownloading(true);
    try {
      const blob = await downloadImprovedResume(improvedData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user?.name?.replace(/\s+/g, "_") || "Resume"}_Improved.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleApplyToProfile = async () => {
    if (!improvedData) return;
    setApplying(true);
    setError(null);
    try {
      const allSkills = (improvedData.skills || []).flatMap((g: any) => g.items || []);
      const experience = (improvedData.experience || []).map((exp: any) => ({
        title: exp.title || "",
        company: exp.company || "",
        duration: exp.duration || "",
        description: (exp.bullets || []).join(". "),
        skills: [],
      }));
      const projects = (improvedData.projects || []).map((p: any) => ({
        name: p.name || "",
        description: p.description || "",
        technologies: p.technologies || [],
      }));

      await updateResumeData({
        skills: allSkills,
        certifications: improvedData.certifications || [],
        education: improvedData.education || [],
        experience,
        projects,
      });
      await fetchProfile();
      setApplied(true);
      setResult(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to apply changes");
    } finally {
      setApplying(false);
    }
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }
      if (file.size > 5 * 1024 * 1024) { setError("File size must be under 5 MB."); return; }
      setError(null);
      setEditing(false);
      try {
        const data = await uploadResume(file);
        setResult(data);
        await fetchProfile();
      } catch (err: any) {
        setError(err.response?.data?.error || "Upload failed");
      }
    },
    [uploadResume, fetchProfile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); },
    [handleFile]
  );

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">Resume Upload</h1>
        <p className="mt-1 text-muted-foreground">
          Upload your resume (PDF) — review and edit the extracted data before running analysis.
        </p>
      </div>

      {/* Upload area */}
      <div
        className={cn(
          "animate-fade-in rounded-2xl border-2 border-dashed p-12 text-center transition-all",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
          loading.resume && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{ animationDelay: "100ms" }}
      >
        {loading.resume ? (
          <LoadingSpinner text="Parsing your resume..." />
        ) : (
          <>
            <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="mb-2 text-lg font-medium">Drag & drop your resume here</p>
            <p className="mb-4 text-sm text-muted-foreground">or click to browse. PDF only, max 5 MB.</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <FileText className="h-4 w-4" />
              Choose File
              <input type="file" accept=".pdf" onChange={onFileSelect} className="hidden" />
            </label>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-destructive" /></button>
        </div>
      )}

      {/* Results */}
      {parsed && (
        <div className="animate-fade-in space-y-6" style={{ animationDelay: "200ms" }}>
          {/* Header + Edit button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Resume parsed successfully!</span>
            </div>
            {!editing ? (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-all hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Extracted Data
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdits}
                  disabled={loading.resumeData}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
                    loading.resumeData && "opacity-70 cursor-not-allowed"
                  )}
                >
                  <Save className="h-3.5 w-3.5" /> {loading.resumeData ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {!editing && (() => {
            const yoe = parsed.yearsOfExperience;
            const certs = parsed.certifications || [];
            const education = parsed.education || [];
            const domains = parsed.domains || [];
            const hasExtras = yoe || certs.length > 0 || education.length > 0 || domains.length > 0;
            if (!hasExtras) return null;
            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {yoe != null && (
                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Clock className="h-5 w-5 text-primary" /></div>
                    <div><p className="text-2xl font-bold">{yoe}+</p><p className="text-xs text-muted-foreground">Years Experience</p></div>
                  </div>
                )}
                {education.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"><GraduationCap className="h-5 w-5 text-blue-500" /></div>
                    <div><p className="text-sm font-medium truncate">{education[0]?.degree}</p><p className="text-xs text-muted-foreground">{education[0]?.year || "Education"}</p></div>
                  </div>
                )}
                {certs.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10"><Award className="h-5 w-5 text-amber-500" /></div>
                    <div><p className="text-2xl font-bold">{certs.length}</p><p className="text-xs text-muted-foreground">Certifications</p></div>
                  </div>
                )}
                {domains.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10"><Briefcase className="h-5 w-5 text-green-500" /></div>
                    <div><p className="text-sm font-medium">{domains.slice(0, 2).join(", ")}</p><p className="text-xs text-muted-foreground">Domains</p></div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* === EDITING MODE === */}
          {editing ? (
            <div className="space-y-6">
              {/* Technical Skills */}
              <div className="rounded-2xl border border-primary/20 bg-card p-6">
                <h3 className="mb-3 font-semibold">Technical Skills</h3>
                <EditableTagList tags={editSkills} onChange={setEditSkills} variant="primary" placeholder="Add a skill (e.g. React)" />
              </div>

              {/* Soft Skills */}
              <div className="rounded-2xl border border-primary/20 bg-card p-6">
                <h3 className="mb-3 font-semibold">Soft Skills</h3>
                <EditableTagList tags={editSoftSkills} onChange={setEditSoftSkills} variant="success" placeholder="Add soft skill (e.g. Leadership)" />
              </div>

              {/* Certifications */}
              <div className="rounded-2xl border border-primary/20 bg-card p-6">
                <h3 className="mb-3 font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Certifications</h3>
                <EditableTagList tags={editCerts} onChange={setEditCerts} variant="warning" placeholder="Add certification (e.g. AWS Certified)" />
              </div>

              {/* Domains */}
              <div className="rounded-2xl border border-primary/20 bg-card p-6">
                <h3 className="mb-3 font-semibold">Domains</h3>
                <EditableTagList tags={editDomains} onChange={setEditDomains} variant="default" placeholder="Add domain (e.g. FinTech)" />
              </div>

              {/* Years of Experience */}
              <div className="rounded-2xl border border-primary/20 bg-card p-6">
                <h3 className="mb-3 font-semibold">Years of Experience</h3>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={editYoe}
                  onChange={(e) => setEditYoe(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Education */}
              <div className="rounded-2xl border border-primary/20 bg-card p-6">
                <h3 className="mb-3 font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-500" /> Education</h3>
                <div className="space-y-3">
                  {editEducation.map((edu, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 grid gap-2 sm:grid-cols-3">
                        <input value={edu.degree} onChange={(e) => { const c = [...editEducation]; c[i] = { ...c[i], degree: e.target.value }; setEditEducation(c); }} placeholder="Degree" className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                        <input value={edu.institution} onChange={(e) => { const c = [...editEducation]; c[i] = { ...c[i], institution: e.target.value }; setEditEducation(c); }} placeholder="Institution" className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                        <input value={edu.year} onChange={(e) => { const c = [...editEducation]; c[i] = { ...c[i], year: e.target.value }; setEditEducation(c); }} placeholder="Year" className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                      </div>
                      <button onClick={() => setEditEducation(editEducation.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => setEditEducation([...editEducation, { degree: "", institution: "", year: "" }])} className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Add Education</button>
                </div>
              </div>

              {/* Experience */}
              <div className="rounded-2xl border border-primary/20 bg-card p-6">
                <h3 className="mb-3 font-semibold">Experience</h3>
                <div className="space-y-4">
                  {editExperience.map((exp, i) => (
                    <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 grid gap-2 sm:grid-cols-3">
                          <input value={exp.title} onChange={(e) => { const c = [...editExperience]; c[i] = { ...c[i], title: e.target.value }; setEditExperience(c); }} placeholder="Job Title" className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                          <input value={exp.company} onChange={(e) => { const c = [...editExperience]; c[i] = { ...c[i], company: e.target.value }; setEditExperience(c); }} placeholder="Company" className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                          <input value={exp.duration} onChange={(e) => { const c = [...editExperience]; c[i] = { ...c[i], duration: e.target.value }; setEditExperience(c); }} placeholder="Duration (e.g. 2021-2023)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                        </div>
                        <button onClick={() => setEditExperience(editExperience.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <textarea
                        value={exp.description}
                        onChange={(e) => { const c = [...editExperience]; c[i] = { ...c[i], description: e.target.value }; setEditExperience(c); }}
                        placeholder="Description"
                        rows={2}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none focus:border-primary"
                      />
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Skills used in this role:</p>
                        <EditableTagList
                          tags={exp.skills}
                          onChange={(skills) => { const c = [...editExperience]; c[i] = { ...c[i], skills }; setEditExperience(c); }}
                          variant="default"
                          placeholder="Add skill"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setEditExperience([...editExperience, { title: "", company: "", duration: "", description: "", skills: [] }])} className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Add Experience</button>
                </div>
              </div>
            </div>
          ) : (
            /* === VIEW MODE === */
            <div className="space-y-6">
              {/* Extracted Skills */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-3 font-semibold">Technical Skills ({(parsed.skills || []).length})</h3>
                <div className="flex flex-wrap gap-2">
                  {(parsed.skills || []).map((skill: string) => (
                    <SkillBadge key={skill} name={skill} variant="primary" />
                  ))}
                  {(parsed.skills || []).length === 0 && <p className="text-sm text-muted-foreground">No skills detected. Click Edit to add manually.</p>}
                </div>
              </div>

              {/* Soft Skills */}
              {(parsed.softSkills || []).length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="mb-3 font-semibold">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(parsed.softSkills || []).map((skill: string) => (
                      <SkillBadge key={skill} name={skill} variant="success" />
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {(parsed.certifications || []).length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="mb-3 font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {(parsed.certifications || []).map((cert: string) => (
                      <SkillBadge key={cert} name={cert} variant="warning" />
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {(parsed.education || []).length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="mb-3 font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-500" /> Education</h3>
                  <div className="space-y-2">
                    {(parsed.education || []).map((e: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <span className="text-sm font-medium">{e.degree}</span>
                          {e.institution && <span className="ml-2 text-xs text-muted-foreground">{e.institution}</span>}
                        </div>
                        {e.year && <span className="text-xs text-muted-foreground">{e.year}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {(parsed.projects || []).length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="mb-3 font-semibold">Projects</h3>
                  <div className="space-y-3">
                    {(parsed.projects || []).map((proj: any, i: number) => (
                      <div key={i} className="rounded-xl border border-border p-4">
                        <p className="font-medium">{proj.name}</p>
                        {proj.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{proj.description}</p>}
                        {proj.technologies?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">{proj.technologies.map((t: string) => <SkillBadge key={t} name={t} size="sm" />)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {(parsed.experience || []).length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="mb-3 font-semibold">Experience</h3>
                  <div className="space-y-3">
                    {(parsed.experience || []).map((exp: any, i: number) => (
                      <div key={i} className="rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{exp.title}</p>
                            {exp.company && <p className="text-sm text-primary">{exp.company}</p>}
                          </div>
                          {exp.duration && <span className="shrink-0 text-xs text-muted-foreground">{exp.duration}</span>}
                        </div>
                        {exp.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{exp.description}</p>}
                        {exp.skills?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">{exp.skills.map((s: string) => <SkillBadge key={s} name={s} size="sm" />)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* === IMPROVE WITH AI === */}
          {!editing && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Improve Resume with AI</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Let AI rewrite your resume with powerful action verbs, quantified achievements, and ATS-friendly formatting.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Target Role (optional)</label>
                      <input
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Full Stack Developer"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <button
                      onClick={handleImprove}
                      disabled={loading.resumeImprove}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shrink-0",
                        loading.resumeImprove && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      {loading.resumeImprove ? "Improving..." : "Improve with AI"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading.resumeImprove && <LoadingSpinner text="AI is rewriting your resume to be more impactful..." />}

          {/* === AI-IMPROVED PREVIEW === */}
          {improvedData && showPreview && !loading.resumeImprove && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">AI-Improved Resume Preview</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowPreview(false); setApplied(false); }}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={handleApplyToProfile}
                    disabled={applying || applied}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10",
                      (applying || applied) && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    <Replace className="h-4 w-4" />
                    {applied ? "Applied" : applying ? "Applying..." : "Apply to Profile"}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
                      downloading && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? "Generating..." : "Download PDF"}
                  </button>
                </div>
              </div>

              {/* Improvements Made */}
              {improvedData.improvements?.length > 0 && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                  <h4 className="mb-2 font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> What AI Improved
                  </h4>
                  <ul className="space-y-1">
                    {improvedData.improvements.map((imp: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Card */}
              <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                {/* Name Header */}
                <div className="border-b border-border bg-muted/30 px-8 py-6 text-center">
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
                </div>

                <div className="p-8 space-y-6">
                  {/* Summary */}
                  {improvedData.summary && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">Professional Summary</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{improvedData.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {improvedData.experience?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Experience</h3>
                      <div className="space-y-4">
                        {improvedData.experience.map((exp: any, i: number) => (
                          <div key={i}>
                            <div className="flex items-baseline justify-between">
                              <p className="font-semibold">{exp.title}{exp.company ? ` | ${exp.company}` : ""}</p>
                              {exp.duration && <span className="text-xs text-muted-foreground shrink-0 ml-2">{exp.duration}</span>}
                            </div>
                            <ul className="mt-1.5 space-y-1">
                              {exp.bullets?.map((b: string, j: number) => (
                                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {improvedData.projects?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Projects</h3>
                      <div className="space-y-3">
                        {improvedData.projects.map((proj: any, i: number) => (
                          <div key={i}>
                            <p className="font-semibold">{proj.name}</p>
                            <p className="text-sm text-muted-foreground">{proj.description}</p>
                            {proj.technologies?.length > 0 && (
                              <p className="mt-1 text-xs text-primary">{proj.technologies.join(", ")}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {improvedData.skills?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Skills</h3>
                      <div className="space-y-1.5">
                        {improvedData.skills.map((group: any, i: number) => (
                          <div key={i} className="text-sm">
                            <span className="font-semibold">{group.category}: </span>
                            <span className="text-muted-foreground">{group.items?.join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {improvedData.education?.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">Education</h3>
                      {improvedData.education.map((edu: any, i: number) => (
                        <div key={i} className="text-sm">
                          <span className="font-semibold">{edu.degree}</span>
                          {edu.institution && <span className="text-muted-foreground"> — {edu.institution}</span>}
                          {edu.year && <span className="text-muted-foreground"> ({edu.year})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certifications */}
                  {improvedData.certifications?.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">Certifications</h3>
                      <ul className="space-y-1">
                        {improvedData.certifications.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action bar at bottom */}
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={handleApplyToProfile}
                  disabled={applying || applied}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border-2 border-primary px-8 py-3 text-base font-semibold text-primary transition-all hover:bg-primary/10",
                    (applying || applied) && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {applied ? (
                    <><CheckCircle2 className="h-5 w-5" /> Applied to Profile</>
                  ) : applying ? (
                    <><Replace className="h-5 w-5 animate-spin" /> Applying...</>
                  ) : (
                    <><Replace className="h-5 w-5" /> Apply to My Profile</>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90",
                    downloading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  <Download className="h-5 w-5" />
                  {downloading ? "Generating PDF..." : "Download as PDF"}
                </button>
              </div>
              {applied && (
                <p className="text-center text-sm text-green-600 dark:text-green-400">
                  Your profile has been updated with the improved resume data. This will be used in future gap analyses.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
