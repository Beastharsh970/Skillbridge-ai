# Skill-Bridge Career Navigator

An AI-powered platform that helps developers identify skill gaps, generate personalized learning roadmaps, improve resumes, and prepare for interviews — powered by your choice of **Google Gemini**, **OpenAI (ChatGPT)**, or **Qwen**.

---

## Submission Info

## App Live Link :https://skillbridge-ai-gamma.vercel.app

## Demo Video Link : https://www.loom.com/share/046c32c89fab4a18a86abc84110f90b3

## 🔐 Demo Account Credentials

You can use the following test account to explore the application:
**Email:** harsh@gmail.com
**Password:** harsh123

> ⚠️ This is a shared demo account. Data may be reset periodically.

| Field | Details |
| --- | --- |
| **Candidate Name** | Harsh Raj |
| **Scenario Chosen** | Career Navigation Platform — AI-powered skill gap analysis and learning roadmap |
| **Estimated Time Spent** | ~5–6 hours |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, TailwindCSS 4 |
| State | Zustand |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose ODM) |
| AI | Google Gemini / OpenAI (ChatGPT) / Qwen (switchable) |
| File Handling | Multer (PDF resume uploads) |
| PDF Generation | PDFKit (improved resume download) |
| Validation | Zod |
| Auth | JWT (bcryptjs) |
| Testing | Vitest, Supertest |

---

## Quick Start

### Prerequisites

- **Node.js** >= 18 — https://nodejs.org
- **MongoDB** — local or [Atlas (free tier)](https://www.mongodb.com/atlas)
- **At least one AI API key** (Gemini recommended — free tier)
- **GitHub Personal Access Token** _(optional, increases API rate limit)_ — https://github.com/settings/tokens

| Provider | Get API Key | Free Tier |
| --- | --- | --- |
| Google Gemini | https://aistudio.google.com/apikey | Yes — 1000 RPM on `gemini-2.5-flash` |
| OpenAI (ChatGPT) | https://platform.openai.com/api-keys | No — requires billing |
| Qwen (Alibaba Cloud) | https://dashscope.console.aliyun.com/ | Yes — limited free quota |

### Run Commands

```bash
# 1. Clone & install
git clone <your-repo-url>
cd "SkillBridge AI"

# 2. Backend
cd server
npm install
cp .env.example .env        # Then fill in your keys (see Environment Variables below)
npm run seed                 # Seeds 14 target roles into MongoDB

# 3. Frontend
cd ../frontend
npm install

# 4. Start (two terminals)
cd server  && npm run dev    # Terminal 1 — backend on :5000
cd frontend && npm run dev   # Terminal 2 — frontend on :5173
```

The app opens at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend automatically.

> **Note:** If you changed the backend `PORT` from 5000, update the proxy target in `frontend/vite.config.ts` to match.

### Test Commands

```bash
cd server
npx vitest run               # Runs 2 tests (1 happy path + 1 edge case)
```

### Production Build

```bash
# Backend
cd server && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in your keys. 

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `5000` | Server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWT tokens |
| `NODE_ENV` | No | `development` | `development` / `production` |
| `AI_PROVIDER` | No | `gemini` | Active AI provider: `gemini`, `openai`, or `qwen` |
| `GEMINI_API_KEY` | If provider=gemini | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Gemini model name |
| `OPENAI_API_KEY` | If provider=openai | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model |
| `QWEN_API_KEY` | If provider=qwen | — | Qwen / DashScope API key |
| `QWEN_MODEL` | No | `qwen-plus` | Qwen model |
| `QWEN_BASE_URL` | No | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Qwen API base URL |
| `GITHUB_TOKEN` | No | — | GitHub PAT — raises rate limit from 60 to 5 000/hr |

**Switching AI Providers** — just change one line in `.env` and restart:

```env
AI_PROVIDER=gemini    # Free tier, recommended
AI_PROVIDER=openai    # Requires billing
AI_PROVIDER=qwen      # Limited free tier
```

---

## Project Structure

```
SkillBridge AI/
├── data.csv                    # Synthetic dataset (10 mock user profiles)
├── server/                     # Express + TypeScript backend
│   ├── src/
│   │   ├── config/             # Environment validation (Zod), DB connection
│   │   ├── controllers/        # Route handlers + tests (auth, user, analysis, roadmap, interview)
│   │   ├── middleware/         # Auth (JWT), error handler, file upload (Multer)
│   │   ├── models/            # Mongoose schemas (User, Role, Analysis, Roadmap, InterviewQuestion, Chat, Skill)
│   │   ├── routes/            # REST API endpoints
│   │   ├── seeds/             # Database seeder (14 roles)
│   │   ├── services/          # AI service (multi-provider), resume parser, GitHub service, PDF generator
│   │   ├── types/             # Custom type declarations
│   │   └── index.ts           # App entry point
│   ├── uploads/               # Uploaded resume PDFs
│   ├── .env.example           # Template for environment variables
│   └── .env                   # Actual secrets (DO NOT commit)
│
└── frontend/                  # React + Vite frontend
    └── src/
        ├── components/        # Layout, ScoreIndicator, SkillBadge, LoadingSpinner, ProtectedRoute
        ├── pages/             # Landing, Login, Register, Dashboard, ResumeUpload, GitHubConnect,
        │                      # GapAnalysis, RoadmapPage, InterviewPrep, AiChat
        ├── stores/            # Zustand stores (authStore, appStore with per-feature loading)
        ├── lib/               # Axios API client, cn() utility
        ├── theme/             # Design system (CSS variables, Tailwind preset, ThemeProvider, dark/light mode)
        └── types/             # Shared TypeScript interfaces
```

---

## Features

### 1. Resume Upload & Editing
- Upload PDF resumes parsed with `pdf-parse`
- Extracts: technical skills, soft skills, experience (with per-role skills), projects, education, certifications, years of experience, and domain expertise
- **Inline editing** — fix any incorrectly extracted data before running analysis (manual fallback)
- **AI Resume Improvement** — rewrites resume with action verbs, quantified achievements, and ATS-friendly formatting
- **Preview & Download** — view the improved resume and download as a professionally formatted PDF
- **Apply to Profile** — replace your extracted data with the AI-improved version

### 2. GitHub Integration
- Fetches repos, languages, topics, and profile stats via GitHub REST API
- **Deep scanning** — reads `package.json` / `requirements.txt` dependencies and README content from top repos
- Derives skills from languages, topics, dependencies, descriptions, and README mentions
- Displays: profile card with stats, language distribution with color-coded stacked bar, repo cards with topics and sizes

### 3. AI Gap Analysis
- **Two modes:** select from 14 pre-seeded target roles, or paste any job description (AI extracts role title, skills, and priorities)
- Sends rich context to AI: skills, experience, education, certifications, GitHub activity, domains
- Returns: readiness score (0–100), missing skills, strengths, skill priority ranking, personalized feedback, and suggestions
- Previous analyses shown as a card grid for quick access

### 4. Learning Roadmap
- AI-generated step-by-step learning path based on missing skills and experience level
- Each skill includes: courses (free + paid), practice projects, coding tasks, time estimates
- Expandable timeline UI with level indicators (beginner/intermediate/advanced)

### 5. Mock Interview Prep
- AI-generated technical, behavioral, and coding questions tailored to target role and skill gaps
- Tabbed interface with difficulty badges and show/hide answers
- **Add More Questions** — expand any existing set by category or specific skills (appended, not replaced)

### 6. AI Career Advisor Chat
- Context-aware chatbot that knows your full profile (skills, experience, GitHub data)
- Provides personalized career advice, learning suggestions, and interview tips
- Conversation history maintained per user

### 7. Multi-Provider AI
- Switch between Gemini, OpenAI, and Qwen with a single `.env` change
- Automatic retry with exponential backoff on rate limits (429) and server errors (503)
- Clear error messages surfaced to the frontend

---

## Core Flow (Create → View → Update + Search/Filter)

1. **Create:** User registers → uploads resume (PDF) → AI extracts skills → optionally connects GitHub → AI runs gap analysis against a target role
2. **View:** Dashboard shows progress, detected skills, and latest readiness score. Gap Analysis page displays strengths, missing skills, priority ranking, and personalized feedback. Previous analyses are listed as a searchable card grid
3. **Update:** User can inline-edit any extracted resume data (manual fallback). AI can improve the resume. User can re-run analysis after updating skills

---

## AI Integration + Fallback Strategy

| AI Capability | Fallback When AI Unavailable |
| --- | --- |
| Resume parsing & skill extraction | Regex + keyword-based parser (`resumeParser.ts`) works independently of AI |
| Gap analysis | Clear error message with retry; user can manually compare skills against role requirements in the UI |
| Resume improvement | User can directly edit all resume fields inline without AI |
| Interview questions | Error surfaced with suggestion to retry or switch AI provider |
| AI Chat advisor | Supplementary feature — not required for core flow |

The **manual inline editing** of resume data is the primary fallback: even if AI extraction is wrong or unavailable, users can always correct their profile data manually before running analysis.

---

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/auth/profile` | Get current user | Yes |

### User & Resume

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/user/upload-resume` | Upload & parse PDF resume | Yes |
| PUT | `/api/user/resume-data` | Edit extracted resume data | Yes |
| POST | `/api/user/resume-improve` | AI-improve resume content | Yes |
| POST | `/api/user/resume-download` | Download improved resume as PDF | Yes |
| POST | `/api/user/github` | Connect & analyze GitHub profile | Yes |
| PUT | `/api/user/profile` | Update user profile | Yes |

### Roles

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/roles` | List all roles | No |
| GET | `/api/roles/:id` | Get role by ID | No |

### Gap Analysis

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/analysis/gap` | Run AI gap analysis (from role) | Yes |
| POST | `/api/analysis/parse-jd` | AI-parse a pasted job description | Yes |
| POST | `/api/analysis/gap-from-jd` | Run gap analysis from parsed JD | Yes |
| GET | `/api/analysis` | List user's analyses | Yes |
| GET | `/api/analysis/:id` | Get analysis by ID | Yes |

### Roadmap

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/roadmap` | Generate learning roadmap | Yes |
| GET | `/api/roadmap` | List user's roadmaps | Yes |
| GET | `/api/roadmap/:id` | Get roadmap by ID | Yes |

### Interview

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/interview/questions` | Generate mock questions | Yes |
| POST | `/api/interview/questions/add-more` | Add more questions to a set | Yes |
| GET | `/api/interview/questions` | List user's question sets | Yes |
| GET | `/api/interview/questions/:id` | Get question set by ID | Yes |

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Server health check |

---

## Synthetic Dataset

A synthetic dataset is included at [`data.csv`](data.csv) in the project root. It contains 10 mock user profiles with fields: Name, Email, Current Role, Years of Experience, Core Skills, Target Role, Target Skills, and GitHub URL. **No real personal data is used.**

---

## AI Disclosure

- **Did you use an AI assistant?** Yes — GitHub Copilot and Gemini were used for boilerplate scaffolding, debugging, and generating initial prompt templates.
- **How did you verify suggestions?** Every AI-generated code block was manually reviewed, tested against edge cases, and validated through the application's runtime behavior. AI-generated prompts were iteratively refined by inspecting JSON output quality.
- **Example of a suggestion rejected/changed:** Copilot suggested using a single monolithic prompt for all AI features. I rejected this and instead designed separate, specialized prompts per feature (gap analysis, roadmap, interview, resume improvement) with strict JSON schema enforcement — this significantly improved output reliability and made each feature independently testable.

---

## Tradeoffs & Prioritization

- **What was cut to stay within the time limit?** Real-time progress tracking on roadmaps, WebSocket-based streaming for AI chat, and automated E2E browser tests were deprioritized. Focused instead on delivering a complete, polished end-to-end flow with solid AI integration.
- **What would you build next?** Mentor dashboard for guided career coaching, progress tracking checkboxes on roadmap items, and importing job descriptions directly from job board APIs.
- **Known limitations:**
  - AI outputs can occasionally be inconsistent (mitigated by JSON schema enforcement, retry logic, and manual editing fallback).
  - GitHub deep scanning is limited to public repos and top repositories to stay within API rate limits.
  - The resume PDF parser (`pdf-parse`) works best with text-based PDFs — scanned image PDFs are not supported.
  - No real-time WebSocket streaming for AI responses — uses standard request/response cycle.

---

## Future Enhancements

- **Real-time collaboration** — allow mentors to view and annotate mentee roadmaps
- **Progress tracking** — mark roadmap items as completed, track learning streaks
- **Job board integration** — auto-import job descriptions from APIs (LinkedIn, Indeed)
- **Certification verification** — validate claimed certifications via issuer APIs
- **Export roadmap as PDF** — downloadable learning plan
- **WebSocket-based AI chat** — streaming responses for the career advisor chat

---

## Troubleshooting

| Problem | Solution |
| --- | --- |
| MongoDB connection refused | Ensure `mongod` is running or your Atlas URI is correct |
| Atlas IP whitelist error | Add `0.0.0.0/0` in Atlas > Network Access > IP Access List |
| Gemini 404 error | Model name may be outdated — try `gemini-2.5-flash` or `gemini-2.0-flash` |
| Gemini 429 rate limit | Wait 60s or switch provider: `AI_PROVIDER=openai` |
| OpenAI insufficient_quota | Add billing at https://platform.openai.com/settings/billing |
| GitHub rate limit exceeded | Add a `GITHUB_TOKEN` to `.env` |
| Resume upload fails | Ensure the file is PDF and under 5 MB |
| Frontend can't reach backend | Verify backend is running and proxy port matches in `vite.config.ts` |
| Roles not showing | Run `npm run seed` in the `server/` directory |

---

## License

MIT
