# HermesX

**AI-Powered Customer Feedback Intelligence Platform**

HermesX ingests customer feedback from multiple channels, automatically classifies it with AI (sentiment, themes, feature area), makes it semantically searchable, and turns it into stakeholder-ready reports and a grounded Q&A assistant — all scoped to per-workspace, multi-tenant data.

This is a single, unified full-stack application: one Next.js codebase serves both the REST API and the dashboard UI.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Demo Accounts](#demo-accounts)
- [Roles & Permissions](#roles--permissions)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Architecture Notes](#architecture-notes)
- [Known Limitations](#known-limitations)

---

## Features

### Feedback Management
- Manual feedback entry, CSV bulk import (up to 1,000 rows), and simulated App Store review sync
- Full-text search, filtering by channel/sentiment/status/theme, date range, and sorting
- Feedback detail view with editable status and audit-friendly history

### AI-Powered Analysis
- Automatic sentiment classification (Positive / Negative / Neutral) with a numeric confidence score
- Automatic theme detection and tagging, with themes reused or created as needed
- One-click reclassification when feedback content is edited or a prior analysis looks wrong

### Semantic Search & Q&A
- Every piece of feedback is embedded into a vector space at creation time
- **Ask HermesX** — a natural-language chat interface that answers questions about your customers, grounded strictly in retrieved feedback (retrieval-augmented generation), with cited sources and a confidence indicator

### Analytics & Reporting
- Live dashboard: total feedback, sentiment breakdown, feedback trend, top themes, recent activity
- Dedicated Trends page: daily sentiment time-series and a full theme leaderboard
- AI-generated stakeholder reports for any date range — executive summary, sentiment analysis, top themes, notable changes, recommended actions, and representative customer quotes — backed entirely by real aggregated statistics
- Print / export report to PDF via the browser

### Team & Workspace Management
- Multi-tenant workspaces with role-based access control (Admin / Analyst / Viewer)
- Team member management: invite, change roles, remove access
- Self-service profile: name, email, password, and profile photo (with automatic client-side resizing)
- Light and Night appearance modes

### Security
- Every database query is scoped to the authenticated user's workspace — enforced in code, not just by convention
- Sessions are re-verified against the database on every privileged action, so a stale or revoked session can never retain access
- Prompt-injection defenses on all AI inputs — customer feedback and user questions are treated as untrusted data, never as instructions
- Rate limiting on sensitive and cost-bearing endpoints
- Passwords hashed with bcrypt; current-password verification required to change a password

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, Route Handlers) |
| Language | TypeScript |
| Database | PostgreSQL with the `pgvector` extension |
| ORM | Prisma |
| Authentication | NextAuth.js (Credentials provider, JWT sessions) |
| Validation | Zod on every request boundary |
| Styling | Tailwind CSS with a custom Light/Night design system |
| Animation | Framer Motion |
| Charts | Recharts |
| Forms | React Hook Form + Zod resolvers |
| LLM | Groq — classification, Ask HermesX, report narratives |
| Embeddings | Cohere (`embed-english-v3.0`, 1024 dimensions) |
| Icons | Lucide React |

---

## Project Structure

```
hermesx/
├── prisma/
│   ├── schema.prisma              # Full data model (Workspace, User, Feedback, Theme, Embedding, Report)
│   ├── migrations/                # Version-controlled schema history
│   └── seed.ts                    # Demo workspace, users, themes, and classified feedback
│
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Public landing page
│   │   ├── layout.tsx                     # Root layout (fonts, providers, theme script)
│   │   ├── globals.css                    # Design system tokens (Light & Night)
│   │   │
│   │   ├── (auth)/                        # Public auth pages
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   │
│   │   ├── (app)/                         # Protected dashboard (session required)
│   │   │   ├── layout.tsx                 # Server-side session guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── inbox/
│   │   │   │   ├── page.tsx               # Feedback list, filters, pagination
│   │   │   │   ├── [id]/page.tsx          # Feedback detail
│   │   │   │   ├── new/page.tsx           # Add feedback manually
│   │   │   │   └── import/page.tsx        # CSV import
│   │   │   ├── trends/page.tsx
│   │   │   ├── ask-hermesx/page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx               # Report list + generate
│   │   │   │   └── [id]/page.tsx          # Report viewer
│   │   │   ├── themes/page.tsx
│   │   │   └── settings/page.tsx          # Profile, Workspace, Team, Appearance tabs
│   │   │
│   │   └── api/                           # REST API (Route Handlers)
│   │       ├── auth/
│   │       │   ├── signup/route.ts
│   │       │   └── [...nextauth]/route.ts
│   │       ├── profile/
│   │       │   ├── route.ts               # Self-service profile get/update
│   │       │   └── password/route.ts      # Password change
│   │       ├── users/
│   │       │   ├── route.ts               # Admin: list/create users
│   │       │   └── [id]/route.ts          # Admin: update/delete user
│   │       ├── workspace/route.ts
│   │       ├── feedback/
│   │       │   ├── route.ts               # List/create
│   │       │   ├── [id]/route.ts          # Get/update/delete
│   │       │   └── import/route.ts        # CSV bulk import
│   │       ├── sources/app-store/sync/route.ts
│   │       ├── themes/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── analytics/
│   │       │   ├── overview/route.ts
│   │       │   ├── volume/route.ts
│   │       │   ├── sentiment/route.ts
│   │       │   ├── themes/route.ts
│   │       │   └── trends/route.ts
│   │       ├── ai/
│   │       │   ├── classify/[feedbackId]/route.ts
│   │       │   └── reclassify/[feedbackId]/route.ts
│   │       ├── ask-hermesx/route.ts
│   │       ├── reports/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── health/route.ts
│   │
│   ├── components/
│   │   ├── ui/                    # Design-system primitives
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── SentimentBadge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── ThemeChip.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/                # App shell
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── charts/                 # Recharts wrappers
│   │   │   ├── TrendLineChart.tsx
│   │   │   ├── SentimentDonutChart.tsx
│   │   │   └── ThemeBarChart.tsx
│   │   ├── feedback/
│   │   │   ├── FeedbackCard.tsx
│   │   │   ├── FeedbackFilters.tsx
│   │   │   └── FileDropzone.tsx
│   │   └── settings/
│   │       └── AvatarUpload.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # Session + role helpers
│   │   ├── useTheme.ts             # Light/Night theme context
│   │   ├── useToast.ts             # Global toast notifications
│   │   ├── useAsync.ts             # Generic data-fetching state
│   │   ├── useDebounce.ts
│   │   └── usePagination.ts
│   │
│   ├── lib/
│   │   ├── env.ts                  # Validated environment configuration
│   │   ├── errors.ts               # Typed application error hierarchy
│   │   ├── logger.ts               # Structured logging with secret redaction
│   │   ├── responses.ts            # Standardized API response envelope
│   │   ├── utils.ts                # Formatting, className, avatar helpers
│   │   ├── image.ts                # Client-side avatar resize/compression
│   │   ├── db/prisma.ts            # Prisma client singleton
│   │   ├── auth/
│   │   │   ├── auth-options.ts     # NextAuth configuration
│   │   │   ├── auth-session.ts     # Server session helper
│   │   │   └── permissions.ts      # requireAuth / requireRole guards
│   │   ├── ai/
│   │   │   ├── groq.ts             # Groq client + structured-output validation
│   │   │   ├── classifier.ts       # Sentiment & theme classification
│   │   │   ├── qa.ts               # Ask HermesX retrieval-augmented Q&A
│   │   │   └── report-narrative.ts # AI report writing
│   │   ├── embeddings/cohere.ts    # Embedding generation & pgvector storage
│   │   ├── retrieval/vector-search.ts  # Workspace-scoped similarity search
│   │   ├── csv/feedback-import.ts  # CSV parsing & bulk import
│   │   ├── security/
│   │   │   ├── rate-limit.ts
│   │   │   └── request-security.ts # Prompt-injection defenses
│   │   └── validation/             # Zod schemas, one file per resource
│   │       ├── auth.ts
│   │       ├── profile.ts
│   │       ├── users.ts
│   │       ├── workspace.ts
│   │       ├── feedback.ts
│   │       ├── themes.ts
│   │       ├── analytics.ts
│   │       ├── ask-hermesx.ts
│   │       └── reports.ts
│   │
│   ├── services/api/               # Typed frontend API client, one module per resource
│   │   ├── client.ts                # Axios instance + error normalization
│   │   ├── auth.api.ts
│   │   ├── profile.api.ts
│   │   ├── users.api.ts
│   │   ├── workspace.api.ts
│   │   ├── feedback.api.ts
│   │   ├── themes.api.ts
│   │   ├── analytics.api.ts
│   │   ├── ask.api.ts
│   │   └── reports.api.ts
│   │
│   ├── providers/Providers.tsx     # Theme context + NextAuth SessionProvider
│   ├── types/
│   │   ├── index.ts                # Shared DTO contract for every API response
│   │   └── next-auth.d.ts          # Session/JWT type augmentation
│   └── middleware.ts                # Security headers for all API routes
│
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- A PostgreSQL database with the `pgvector` extension available (e.g. [Neon](https://neon.tech))
- API keys for [Groq](https://console.groq.com) and [Cohere](https://dashboard.cohere.com)

### Installation

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your database connection string and API keys (see [Environment Variables](#environment-variables)).

### Enable pgvector

Run this once against your database before migrating:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Run migrations and seed demo data

```bash
npx prisma migrate dev
npm run prisma:seed
```

### Start the development server

```bash
npm run dev
```

The app will be running at `http://localhost:3000` — the landing page, auth flow, dashboard, and API all live on this one server.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (must support `pgvector`) |
| `NEXTAUTH_SECRET` | Random secret used to sign session tokens — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `GROQ_API_KEY` | API key for Groq |
| `GROQ_MODEL` | Groq model identifier (defaults to `openai/gpt-oss-20b`) |
| `COHERE_API_KEY` | API key for Cohere |
| `COHERE_EMBED_MODEL` | Embedding model (defaults to `embed-english-v3.0`) |
| `EMBEDDING_DIMENSIONS` | Vector dimensionality (defaults to `1024`) |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run the TypeScript compiler without emitting files |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:migrate` | Create and apply a new migration |
| `npm run prisma:deploy` | Apply existing migrations (production) |
| `npm run prisma:seed` | Seed demo data |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

---

## Demo Accounts

After seeding, a "HermesX Demo" workspace is created with three accounts, all using the password `Password123!`:

| Email | Role |
|---|---|
| `admin@hermesx.dev` | Admin |
| `analyst@hermesx.dev` | Analyst |
| `viewer@hermesx.dev` | Viewer |

---

## Roles & Permissions

| Capability | Admin | Analyst | Viewer |
|---|:---:|:---:|:---:|
| View feedback, themes, analytics, reports | ✅ | ✅ | ✅ |
| Use Ask HermesX | ✅ | ✅ | ✅ |
| Create, edit, delete feedback | ✅ | ✅ | ❌ |
| Import CSV / sync App Store data | ✅ | ✅ | ❌ |
| Create and edit themes | ✅ | ✅ | ❌ |
| Delete themes | ✅ | ❌ | ❌ |
| Run AI classification | ✅ | ✅ | ❌ |
| Generate reports | ✅ | ✅ | ❌ |
| Manage team members | ✅ | ❌ | ❌ |
| Rename workspace | ✅ | ❌ | ❌ |
| Edit own profile & password | ✅ | ✅ | ✅ |

---

## API Reference

All routes are prefixed with `/api`. Every route except `/api/health` and `/api/auth/*` requires an authenticated session.

| Route | Methods | Access |
|---|---|---|
| `/auth/signup` | POST | Public |
| `/auth/[...nextauth]` | — | Public (NextAuth) |
| `/profile` | GET, PATCH | Self |
| `/profile/password` | PATCH | Self |
| `/users` | GET, POST | Admin |
| `/users/:id` | PATCH, DELETE | Admin |
| `/workspace` | GET, PATCH | GET: any · PATCH: Admin |
| `/feedback` | GET, POST | GET: any · POST: Admin/Analyst |
| `/feedback/:id` | GET, PATCH, DELETE | GET: any · others: Admin/Analyst |
| `/feedback/import` | POST | Admin/Analyst |
| `/sources/app-store/sync` | POST | Admin/Analyst |
| `/themes` | GET, POST | GET: any · POST: Admin/Analyst |
| `/themes/:id` | PATCH, DELETE | PATCH: Admin/Analyst · DELETE: Admin |
| `/analytics/overview` | GET | Any |
| `/analytics/volume` | GET | Any |
| `/analytics/sentiment` | GET | Any |
| `/analytics/themes` | GET | Any |
| `/analytics/trends` | GET | Any |
| `/ai/classify/:feedbackId` | POST | Admin/Analyst |
| `/ai/reclassify/:feedbackId` | POST | Admin/Analyst |
| `/ask-hermesx` | POST | Any |
| `/reports` | GET, POST | GET: any · POST: Admin/Analyst |
| `/reports/:id` | GET | Any |
| `/health` | GET | Public |

Every response follows one of three shapes:

```jsonc
// Success
{ "success": true, "data": { ... } }

// Success, paginated
{ "success": true, "data": [ ... ], "pagination": { "page": 1, "limit": 20, "total": 47, "totalPages": 3 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

---

## Database Schema

| Model | Purpose |
|---|---|
| `Workspace` | Top-level tenant boundary — everything else belongs to exactly one workspace |
| `User` | Workspace members with a role (Admin/Analyst/Viewer), credentials, and an optional profile photo |
| `Feedback` | A single piece of customer feedback, its channel, and AI-derived sentiment/feature area |
| `Theme` | A named topic/category, unique per workspace |
| `FeedbackTheme` | Many-to-many join between feedback and themes, with a confidence score |
| `Embedding` | A `pgvector` vector representing a feedback item's semantic content |
| `Report` | A generated AI report for a given date range, including its narrative and underlying statistics |

---

## Architecture Notes

- **Multi-tenancy is enforced in code.** Every query touching workspace-owned data is filtered by `workspaceId` derived from a database-verified session — never from a client-supplied value.
- **Sessions are re-verified on every privileged call.** A JWT alone is never trusted for role or workspace membership; the current database record is re-read each time.
- **AI failures never lose data.** Feedback is always saved first; classification and embedding generation are best-effort follow-ups that can be safely retried.
- **Retrieval is tenant-scoped at the SQL level.** The pgvector similarity search filters by `workspaceId` inside the query itself, not after the fact.
- **Prompt injection is treated as a first-class threat.** All AI inputs derived from user-authored content are wrapped with explicit instructions that they are data, not commands.
- **Profile photos are stored as resized, compressed base64 data URLs** directly in the database — no external object storage is required to run this project.

---

## Known Limitations

- Rate limiting is in-memory per server instance — suitable for blunting casual abuse, not a substitute for a shared store (e.g. Redis) under sustained adversarial load.
- App Store sync generates realistic simulated review data and does not connect to any real App Store API.
- CSV import runs synchronously within a single request and is bounded to 1,000 rows / 5MB per file.
