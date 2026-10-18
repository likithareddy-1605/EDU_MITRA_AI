# EduMitra AI

**AI-Enabled Family Decision-Support Platform for Engineering Education**

EduMitra AI helps engineering students achieve their academic and career goals
while helping their families understand, support and participate in important
educational decisions. It is more than a chatbot: it uses the student's
information (academic records, goals, interests, career aspirations) to
produce **personalized, explainable** guidance, and it surfaces that guidance
to parents in plain language — with the student controlling what is shared.

> **Status (built milestone-by-milestone):**
> - ✅ **M1** — project setup, app shell, routing, design system, dashboards, Express skeleton.
> - ✅ **M2** — editable student data store + real Student Dashboard features: profile, academics (CGPA/SGPA/subject trends/semester comparison), goals CRUD, weekly study planner, progress (streaks, achievements, insights).
> - ✅ **Engineering Course Advisor** — interactive assessment → transparent rule-based branch recommendations → comparison → colleges → personalized report, with optional server-side AI summary (fallback when no key).
> - ✅ **Parent Dashboard** — rewired to the linked student's real shared data; goals shown only when the student has shared them.
> - ✅ **Family Decision Comparison (Module E)** — 4-step collaborative family decision workflow (Branch Picker, Side-by-Side Comparison with authentic curriculum & roles, Student vs Parent Preferences, and Decision Record with localStorage persistence).
> - ⬜ **Remaining** — Modules C, D, F–J; Supabase auth/DB (structure & env examples ready, **not** configured); wellbeing; resources; notifications; analytics; full Telugu pass.

---

## Problem statement

*"AI-Enabled Family Decision-Support Platform for Engineering Education."*
The platform must help students and families answer:

1. Where is the student currently?
2. What are their strengths and improvement areas?
3. Which academic/career goals should they prioritize?
4. What practical actions should they take next?
5. How can the family support the student's goals?
6. Which engineering branch suits a student who has not yet joined a course?
7. How can students and families compare options and decide informedly?

---

## Technology stack

| Area | Choice |
|------|--------|
| Frontend | React, TypeScript, Vite, Tailwind CSS v4, React Router, Lucide icons, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database & auth | Supabase (PostgreSQL) + Supabase Auth + Row Level Security *(Milestone 2)* |
| AI | Gemini API (server-side only, keys never exposed to the browser) *(Milestone 3)* |
| Deployment | Vercel (frontend) + a supported backend host for Express |
| Version control | Git / GitHub |

All services used have free tiers; no paid service is required for the demo.

---

## Architecture overview

```
EDU_MITRA_AI/
├── client/            # React + Vite frontend (TypeScript)
│   └── src/
│       ├── app/            # routing + navigation config
│       ├── components/      # reusable UI (design system) + shared widgets
│       ├── contexts/       # React context providers
│       ├── data/           # clearly-labelled demo data
│       ├── features/       # feature modules (student-dashboard, parent-dashboard, course-advisor, academics, goals, ...)
│       ├── hooks/          # custom hooks
│       ├── layouts/        # app shell (sidebar + topbar)
│       ├── locales/        # i18n (English + Telugu)
│       ├── pages/          # route-level pages
│       ├── services/       # API clients (course advisor)
│       ├── types/          # shared domain types
│       └── utils/          # helpers (cn, format, studentStats, courseAdvisorEngine)
└── server/           # Express + TypeScript backend
    └── src/
        ├── routes/
        ├── middleware/
        └── utils/
```

**Data flow:** `React app → Express API → (Supabase for data) and (Gemini for AI)`.
AI calls and secret keys stay server-side; the browser only talks to the
Express API. Until Supabase/Gemini are configured, the app runs in an
explicitly-labelled **demo mode** with deterministic fallbacks — it never fakes
live AI responses.

---

## Implemented features

- **App shell & routing** — role-aware sidebar navigation, responsive mobile
  drawer, React Router with guarded student/parent areas and a 404 page.
- **Design system** — Tailwind v4 theme (deep navy/blue structure, teal/green
  for progress), reusable `Card`, `Button`, `Badge`, `ProgressBar`, `StatCard`,
  `PageHeader`, `EmptyState`, `Spinner`.
- **Student dashboard** — recommended next action, stat cards (CGPA, active
  goals, learning streak, placement readiness), CGPA trend chart, subject
  performance chart (Recharts), active goals with progress, strengths &
  improvement areas, upcoming activities, recent achievements.
- **Parent dashboard** — plain-language academic summary, shared goals,
  achievements, support suggestions, an interactive family action plan, and the
  **Engineering Course Advisor** entry card.
- **Student Dashboard features (M2)** — editable profile; academics with add/edit/delete
  records and computed CGPA/SGPA, subject trends and semester comparison; goal CRUD with
  progress, deadlines and a share-with-parent toggle; weekly study planner; progress page
  with computed learning streak, achievement timeline and personal insights. All persisted
  locally (clearly labelled demo data — **not** a cloud database).
- **Parent Dashboard (M2)** — reads the linked student's real shared data: computed CGPA
  and trend, plain-language summary, shared goals only (permission-respected), achievements,
  support suggestions and an interactive family action plan.
- **Engineering Course Advisor** — multi-step wizard: interests/strengths, academic
  profile, budget/location, transparent rule-based branch recommendations with reasons,
  skills, careers and trade-offs, side-by-side comparison, user-added colleges with budget
  check, and a personalized report with family-discussion questions and next steps. No
  fabricated fees/cutoffs/placements.
- **Family Decision Comparison (Module E)** — guided 4-step collaborative family decision
  platform:
  1. *Branch Picker*: select up to 3 engineering branches supported by authentic descriptive data;
  2. *Side-by-Side Comparison*: compares match score, core subjects, career paths, entry roles, key skills, pros, cons and trade-offs with explicit indicators for missing data;
  3. *Student & Parent Preferences*: independent entry for student and parent priorities & notes, respecting role autonomy;
  4. *Decision Record*: review evaluated options, preferences, and save/edit the final family choice with rationale, concerns, and trade-offs, persisted via localStorage demo store.
  Directly accessible from both Student and Parent Dashboards.
- **AI integration (server-side)** — `POST /api/course-advisor/explain` calls Gemini when
  `GEMINI_API_KEY` is set and returns a labelled rule-based fallback otherwise; keys never
  reach the browser. The UI clearly labels demo/fallback vs live AI.
- **i18n** — English + Telugu translation system with a language switcher
  (Telugu is a starter set, fully expanded in Milestone 5).
- **Demo mode** — an honestly-labelled role selector (Student / Parent) so both
  dashboards can be explored without real auth. This is **not** secure
  authentication; real Supabase Auth arrives in Milestone 2.
- **Backend skeleton** — Express server with a working `/api/health` endpoint
  that reports what is/isn't configured, centralised error handling, and
  environment-based config.
- **Shared types** — domain models shared across the app.

Not-yet-built modules route to an honest "Planned for milestone X" page rather
than pretending to work.

---

## Getting started (local development)

### Prerequisites
- Node.js 18+ (built and tested on Node 24)
- npm

### 1. Frontend (client)
```bash
cd client
npm install
npm run dev
```
The app opens at http://localhost:5173.

### 2. Backend (server)
```bash
cd server
npm install
cp .env.example .env      # then edit if you have real keys (optional for M1)
npm run dev
```
The API runs at http://localhost:4000 — check http://localhost:4000/api/health.

---

## Environment variables

See `server/.env.example`. For Milestone 1 **none are required** — the app runs
fully in demo/fallback mode. Later milestones use:

| Variable | Purpose | Required |
|----------|---------|----------|
| `PORT` | Backend port (default 4000) | No |
| `CLIENT_ORIGIN` | CORS origin for the frontend | No |
| `SUPABASE_URL` | Supabase project URL | Milestone 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (server only) | Milestone 2 |
| `GEMINI_API_KEY` | Gemini API key (server only) | Milestone 3 |

**Never commit `.env` files.** They are git-ignored.

---

## Database & authentication (Supabase)

**Current state:** Supabase is **not yet configured** — the app runs entirely on
clearly-labelled local (browser) demo data. The integration structure and
environment-variable examples are prepared so it can be enabled without a rewrite.

To enable real authentication and persistence (free Supabase tier):

1. Create a project at https://supabase.com; copy the **Project URL** and **anon / service role keys**.
2. Add them to `server/.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Create tables for users, student profiles, parent–student relationships, sharing
   permissions, academic records, goals, study plans, achievements, career roadmaps,
   decisions, recommendations, course assessments, branch/college info, reports and notifications.
4. Enable **Row Level Security** with policies so a parent only reads a student's data
   when an explicit, student-authorized relationship exists.

Until these steps are completed, the app honestly labels data as local/demo and does
**not** claim authentication or database storage is operational.

---

## Testing

- **Type check + production build (client):** `cd client && npm run build`
  (runs `tsc -b && vite build`).
- **Lint (client):** `cd client && npm run lint`.
- **Type check (server):** `cd server && npm run typecheck`.

Manual journeys to verify (per the spec) include: student reviews progress and
sets a goal; parent reviews authorized info; student gets explained career
guidance; family compares options; a pre-engineering student uses the Course
Advisor; and the app stays usable when AI is unavailable.

---

## Deployment

- **Frontend:** deploy `client/` to Vercel (build: `npm run build`, output:
  `dist`). Set the API base URL as an env var when the backend is hosted.
- **Backend:** deploy `server/` to a Node-capable host (Render/Railway/Fly or
  Vercel serverless functions). Run `npm run build` then `npm start`.

Verify the production build before deploying (`npm run build` in `client`).

---

## Roadmap

| Milestone | Scope | Status |
|----------|-------|--------|
| 1 | Project setup, app shell, routing, design system, dashboards, shared types, Express skeleton | ✅ |
| 2 | Student data store, profile, academics, goals, study planner, progress, parent shared-data view | ✅ |
| — | Engineering Course Advisor (rule-based recommendations + optional AI) | ✅ |
| 3 | AI academic advisor, career guidance, family decision comparison (Modules C–E) | ⬜ |
| 4 | Wellbeing, learning resources, notifications, analytics (Modules F–J) | ⬜ |
| 5 | Supabase auth/DB + RLS enabled end-to-end | ⬜ |
| 6 | Full Telugu pass, testing, responsive verification, GitHub prep, deployment | ⬜ |

---

## Known limitations

- No real authentication yet — the role selector is an explicitly-labelled demo.
  Supabase auth + Row Level Security are prepared (env + structure) but **not** configured.
- Student data is persisted only in the browser (localStorage) for the demo — it is
  **not** stored in a cloud database. This is labelled clearly in the UI.
- The Engineering Course Advisor uses a transparent rule-based engine in demo mode;
  AI (Gemini) is server-side and activates only when `GEMINI_API_KEY` is set, with a
  clearly-labelled fallback otherwise.
- Modules C–J (AI academic advisor, career guidance, family decisions, wellbeing,
  resources, notifications, analytics) are not yet implemented.
- The frontend JS bundle is large (~780 KB) because Recharts is bundled; this will be
  code-split in a later milestone.
- Telugu is complete for the shell and M2 student pages; the Course Advisor's long
  instructional strings are English in Telugu mode for now and are finalized in the
  multilingual pass.

---

## Privacy & security (design intent)

- The student owns their data; a parent only sees what the student authorizes.
- Sharing is explicit and revocable; private notes are never exposed.
- Authorization will be enforced server-side and via Row Level Security, not
  merely by hiding UI.
- API keys live only on the server; never in browser code.
- AI outputs are framed as decision *support*, not authority.
