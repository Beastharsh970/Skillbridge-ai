# Design Documentation — SkillBridge AI

---

## 1. Problem Statement

Students and early-career professionals face a **skills gap** between academic knowledge and job market requirements. There is no single tool that maps current skills to a target role and provides an actionable learning path. SkillBridge AI solves this by combining AI-powered resume analysis, gap detection, and personalized roadmap generation into one platform.

---

## 2. Design Goals

- **Clarity of Path** — every user leaves with a concrete next step
- **AI + Human Control** — AI accelerates analysis, but users can always override or correct
- **Provider Agnostic** — not locked into a single AI vendor
- **Synthetic-Only Data** — zero real PII; safe to demo and share

---

## 3. Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| **Frontend** | React 19 + TypeScript + Vite 8 | Fast HMR, type safety, modern DX |
| **Styling** | TailwindCSS 4 | Utility-first, dark/light theme via CSS variables |
| **State** | Zustand | Lightweight, per-feature loading states without boilerplate |
| **Backend** | Node.js + Express + TypeScript | Shared language with frontend, strong ecosystem |
| **Database** | MongoDB (Mongoose ODM) | Flexible schema for varied AI outputs (analyses, roadmaps, questions) |
| **AI** | Gemini / OpenAI / Qwen (switchable) | Provider abstraction layer; swap via single `.env` variable |
| **Validation** | Zod | Runtime type-checking on both env config and API inputs |
| **Auth** | JWT + bcryptjs | Stateless auth, secure password hashing |
| **File Upload** | Multer | Handles PDF resume multipart uploads |
| **PDF Generation** | PDFKit | Generates improved resume as downloadable PDF |
| **Testing** | Vitest + Supertest | Fast unit tests with mocking for controllers |

---

## 4. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND (React SPA)                 │
│  Landing → Register/Login → Dashboard → Feature Pages    │
│  Zustand stores  │  Axios API client  │  Theme Provider  │
└──────────────────────────┬───────────────────────────────┘
                           │  REST API (JSON)
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   BACKEND (Express + TS)                  │
│                                                          │
│  Routes → Controllers → Services → Models                │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐│
│  │ Auth        │  │ Resume       │  │ AI Service       ││
│  │ Middleware   │  │ Parser       │  │ (Multi-Provider) ││
│  │ (JWT)       │  │ (pdf-parse)  │  │ Gemini/OpenAI/   ││
│  │             │  │              │  │ Qwen             ││
│  └─────────────┘  └──────────────┘  └──────────────────┘│
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ GitHub       │  │ Resume PDF   │  │ Error Handler  │ │
│  │ Service      │  │ Generator    │  │ (Zod + AppError│ │
│  │ (REST API)   │  │ (PDFKit)     │  │  middleware)   │ │
│  └──────────────┘  └──────────────┘  └────────────────┘ │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │    MongoDB (Mongoose)    │
              │  Users, Roles, Analyses, │
              │  Roadmaps, Questions,    │
              │  Chat History            │
              └─────────────────────────┘
```

---

## 5. Core User Flow

```
Register/Login
     │
     ▼
 Dashboard ──────────────────────────────────┐
     │                                       │
     ▼                                       ▼
Upload Resume (PDF)              Connect GitHub (optional)
     │                                       │
     ▼                                       │
AI extracts skills ◄────────────────────────►│
     │                                       │
     ▼                                       │
User reviews & edits (FALLBACK) ◄────────────┘
     │
     ▼
Select Target Role  ─── OR ───  Paste Job Description
     │                                │
     └────────────┬───────────────────┘
                  ▼
         AI Gap Analysis
    (readiness score, missing skills,
     strengths, ranked priorities)
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
   Learning    Mock       AI Resume
   Roadmap    Interview   Improvement
              Prep        + PDF Download
```

---

## 6. AI Design Decisions

### 6.1 Multi-Provider Abstraction

A single `generateJSON<T>()` pipeline handles all AI calls:

1. **Provider selection** — reads `AI_PROVIDER` from `.env`
2. **Prompt dispatch** — routes to Gemini SDK, OpenAI client, or Qwen (OpenAI-compatible)
3. **JSON cleaning** — strips markdown fences from AI responses
4. **Retry logic** — exponential backoff on 429 (rate limit) and 503 (server error)
5. **Type safety** — generic return type ensures each caller gets the correct shape

### 6.2 Specialized Prompts

Each feature has its own carefully engineered prompt rather than a shared generic one:

| Feature | Prompt Focus | Output Schema |
| --- | --- | --- |
| Gap Analysis | Compare candidate profile vs. role; weight skills (40%), experience (25%), GitHub (20%), education (15%) | `GapAnalysisResult` |
| Roadmap | Order skills by priority; include free + paid courses, projects, practice tasks | `RoadmapResult` |
| Interview | Generate technical, behavioral, coding questions with difficulty levels | `InterviewQuestionsResult` |
| Resume Improve | Rewrite with action verbs, quantified metrics, ATS formatting | `ImprovedResumeResult` |
| Parse JD | Extract role, skills, priority levels, experience level from raw text | `ParsedJobDescription` |
| Career Chat | Context-aware advisor using full user profile; markdown responses | Plain text |

### 6.3 Fallback Strategy

| Scenario | Fallback |
| --- | --- |
| AI API is down / rate-limited | Clear error message + retry suggestion + option to switch provider |
| AI extracts wrong data | User can inline-edit every field before proceeding |
| AI returns invalid JSON | Auto-retry up to 2 times; if still fails, surface error to user |
| Resume parser fails on complex PDF | Regex + keyword-based parser (`resumeParser.ts`) runs independently of AI |

---

## 7. Data Model Overview

| Collection | Key Fields | Purpose |
| --- | --- | --- |
| **User** | name, email, password (hashed), skills, resumeParsed, githubData, experienceLevel | Core user profile with all extracted data |
| **Role** | title, slug, requiredSkills (with priority + category), demandLevel, averageSalary | 14 pre-seeded target roles |
| **Analysis** | userId, roleId, roleName, readinessScore, missingSkills, strengths, feedback | Saved gap analysis results |
| **Roadmap** | userId, analysisId, items (courses, projects, tasks), totalEstimatedTime | Learning path tied to an analysis |
| **InterviewQuestion** | userId, roleName, technical, behavioral, coding questions | Generated mock interview sets |
| **Chat** | userId, messages (role + content + timestamp) | AI career advisor conversation history |

---

## 8. Security Measures

- **API keys** — stored in `.env`, never committed; `.env.example` provided as template
- **Passwords** — hashed with bcryptjs (12 salt rounds)
- **Auth** — stateless JWT tokens (7-day expiry); `authenticate` middleware on all protected routes
- **Input validation** — Zod schemas on registration, login, and all API inputs; `ZodError` → 400 with field-level details
- **File uploads** — Multer with 5MB limit, PDF-only filter
- **Environment validation** — Zod schema validates all env vars at startup; exits on misconfiguration

---

## 9. Testing Strategy

| Test | Type | What It Verifies |
| --- | --- | --- |
| **Happy Path** — Register | Unit (Vitest + Supertest) | Valid registration returns 201 + JWT token + user object |
| **Edge Case** — Invalid Input | Unit (Vitest + Supertest) | Missing name, invalid email, short password → 400 with Zod validation details |

Run with: `cd server && npx vitest run`

---

## 10. Future Enhancements

| Priority | Enhancement | Impact |
| --- | --- | --- |
| 🔴 High | **Progress tracking** — checkboxes on roadmap items, learning streaks | Core UX improvement |
| 🔴 High | **Mentor dashboard** — mentors view and annotate mentee roadmaps | Serves target audience (mentors) |
| 🟡 Medium | **Job board integration** — auto-import JDs from LinkedIn/Indeed APIs | Saves manual paste step |
| 🟡 Medium | **WebSocket AI chat** — streaming responses for real-time feel | Better chat UX |
| 🟡 Medium | **Export roadmap as PDF** — downloadable learning plan | Offline access |
| 🟢 Low | **Certification verification** — validate via issuer APIs | Trust layer |
| 🟢 Low | **E2E browser tests** — Playwright/Cypress for full flow | Quality assurance |
