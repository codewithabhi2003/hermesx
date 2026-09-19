# HermesX

**AI-Powered Customer Feedback Intelligence Platform**

HermesX ingests customer feedback from multiple channels, automatically classifies it with AI (sentiment, themes, feature area), makes it semantically searchable, and turns it into stakeholder-ready reports and a grounded Q&A assistant — all scoped to per-workspace, multi-tenant data.

This is a single, unified full-stack application: one Next.js codebase serves both the REST API and the dashboard UI.

---

## Submission & Demo

Live Demo: https://hermesx-wine.vercel.app

Source Code: https://github.com/codewithabhi2003/zidio-hermesx

Demo Video: https://drive.google.com/drive/folders/15U54w9UUKx2nzNMg-zRpkO0DfMuHg8VJ?usp=sharing

Feedback / Self-Review Video: https://drive.google.com/file/d/1GhHhE7zihbddbeMqhc7cgYZQQYsvacth/view?usp=sharing

Internship context: HermesX was developed as part of Project LOOP – AI Customer Feedback Intelligence Platform during the Zidio internship. HermesX is the product name; Project LOOP is the official internship project title.

The live deployment opens on the public HermesX landing page without requiring authentication. Dashboard demo accounts are provided below for evaluators who want to explore the authenticated product.

---

## Table of Contents

- Submission & Demo

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

- New feedback is classified automatically on creation, App Store sync, and (for the first batch of rows) CSV import

- A bounded **batch classification** endpoint clears any remaining backlog in chunks, driven by a progress indicator in the Inbox

### Review Workflow

- **Review Mode** — a focused, one-at-a-time review queue for working through unreviewed feedback quickly, ordered with the most negative sentiment first

- Keyboard shortcuts (`R` mark reviewed & advance, `→` skip, `←` go back) so a large backlog can be worked through without touching the mouse

- Inline "Analyze now" / "Re-analyze" directly from the review queue, without leaving the flow

### Semantic Search & Q&A

- Every piece of feedback is embedded into a vector space at creation time

- **Ask HermesX** — a natural-language chat interface that answers questions about your customers, grounded strictly in retrieved feedback (retrieval-augmented generation), with cited sources and a confidence indicator

### Analytics & Reporting

- Live dashboard: total feedback, sentiment breakdown, feedback trend, top themes, recent activity

- Dedicated Trends page: daily sentiment time-series and a full theme leaderboard

- AI-generated stakeholder reports for any date range — executive summary, sentiment analysis, top themes, notable changes, recommended actions, and representative customer quotes — backed entirely by real aggregated statistics

- Reports transparently flag when part of the selected period hadn't been AI-classified yet, rather than silently showing totals that don't add up

- Genuine period-over-period comparison (this period vs. the immediately preceding one of equal length), not an estimate

- **Real PDF export** — a proper multi-page, professionally laid-out PDF generated server-side, not a browser print-to-PDF of the webpage

### Team & Workspace Management

- Multi-tenant workspaces with role-based access control (Admin / Analyst / Viewer)

- Team member management: invite, change roles, remove access

- Self-service profile: name, email, password, and profile photo (resized and compressed client-side before upload)

- Light and Night appearance modes

- Framer Motion throughout — animated modals, toasts, navigation, and page transitions

### Security

- Every database query is scoped to the authenticated user's workspace — enforced in code, not just by convention

- Sessions are re-verified against the database on every privileged action, so a stale or revoked session can never retain access

- The session/JWT cookie is kept deliberately minimal (identity claims only) — profile photos are fetched via API, never embedded in the cookie (see [Architecture Notes](#architecture-notes))

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

| Charts | Recharts (web), plain View-based layouts (PDF) |

| PDF Generation | @react-pdf/renderer |

| Forms | React Hook Form + Zod resolvers |

| LLM | Groq — classification, Ask HermesX, report narratives |

| Embeddings | Cohere (`embed-english-v3.0`, 1024 dimensions) |

| Icons | Lucide React |

---

## Project Structure

```

hermesx/

├── prisma/

│   ├── schema.prisma              # Full data model (Workspace, User, Feedback, Theme, Embedding, Report)

│   ├── migrations/                # Version-controlled schema history

│   └── seed.ts                    # Demo workspace, users, themes, and classified feedback

│

├── src/

│   ├── app/

│   │   ├── page.tsx                       # Public landing page

│   │   ├── layout.tsx                     # Root layout (fonts, providers, theme script)

│   │   ├── globals.css                    # Design system tokens (Light & Night)

│   │   │

│   │   ├── (auth)/                        # Public auth pages

│   │   │   ├── layout.tsx

│   │   │   ├── login/page.tsx

│   │   │   └── signup/page.tsx

│   │   │

│   │   ├── (app)/                         # Protected dashboard (session required)

│   │   │   ├── layout.tsx                 # Server-side session guard

│   │   │   ├── dashboard/page.tsx

│   │   │   ├── inbox/

│   │   │   │   ├── page.tsx               # Feedback list, filters, pagination, batch analyze

│   │   │   │   ├── [id]/page.tsx          # Feedback detail

│   │   │   │   ├── new/page.tsx           # Add feedback manually

│   │   │   │   ├── import/page.tsx        # CSV import

│   │   │   │   └── review/page.tsx        # Review Mode — keyboard-driven review queue

│   │   │   ├── trends/page.tsx

│   │   │   ├── ask-hermesx/page.tsx

│   │   │   ├── reports/

│   │   │   │   ├── page.tsx               # Report list + generate

│   │   │   │   └── [id]/page.tsx          # Report viewer + PDF export

│   │   │   ├── themes/page.tsx

│   │   │   └── settings/page.tsx          # Profile, Workspace, Team, Appearance tabs

│   │   │

│   │   └── api/                           # REST API (Route Handlers)

│   │       ├── auth/

│   │       │   ├── signup/route.ts

│   │       │   └── [...nextauth]/route.ts

│   │       ├── profile/

│   │       │   ├── route.ts               # Self-service profile get/update

│   │       │   └── password/route.ts      # Password change

│   │       ├── users/

│   │       │   ├── route.ts               # Admin: list/create users

│   │       │   └── [id]/route.ts          # Admin: update/delete user

│   │       ├── workspace/route.ts

│   │       ├── feedback/

│   │       │   ├── route.ts               # List/create

│   │       │   ├── [id]/route.ts          # Get/update/delete

│   │       │   └── import/route.ts        # CSV bulk import (auto-classifies a bounded first batch)

│   │       ├── sources/app-store/sync/route.ts

│   │       ├── themes/

│   │       │   ├── route.ts

│   │       │   └── [id]/route.ts

│   │       ├── analytics/

│   │       │   ├── overview/route.ts

│   │       │   ├── volume/route.ts

│   │       │   ├── sentiment/route.ts

│   │       │   ├── themes/route.ts

│   │       │   └── trends/route.ts

│   │       ├── ai/

│   │       │   ├── classify/[feedbackId]/route.ts

│   │       │   ├── reclassify/[feedbackId]/route.ts

│   │       │   └── classify-batch/route.ts    # Bounded batch classification for pending backlogs

│   │       ├── ask-hermesx/route.ts

│   │       ├── reports/

│   │       │   ├── route.ts

│   │       │   └── [id]/

│   │       │       ├── route.ts

│   │       │       └── pdf/route.tsx          # Server-side PDF generation (note the .tsx — uses JSX)

│   │       └── health/route.ts

│   │

│   ├── components/

│   │   ├── ui/                    # Design-system primitives

│   │   │   ├── Avatar.tsx

│   │   │   ├── Badge.tsx

│   │   │   ├── Button.tsx

│   │   │   ├── Card.tsx

│   │   │   ├── ConfirmDialog.tsx

│   │   │   ├── EmptyState.tsx

│   │   │   ├── ErrorState.tsx

│   │   │   ├── Input.tsx

│   │   │   ├── Modal.tsx

│   │   │   ├── Pagination.tsx

│   │   │   ├── Select.tsx

│   │   │   ├── SentimentBadge.tsx

│   │   │   ├── Skeleton.tsx

│   │   │   ├── StatCard.tsx

│   │   │   ├── Textarea.tsx

│   │   │   ├── ThemeChip.tsx

│   │   │   ├── ThemeToggle.tsx

│   │   │   └── Toast.tsx

│   │   ├── layout/                # App shell

│   │   │   ├── AppShell.tsx

│   │   │   ├── Sidebar.tsx

│   │   │   └── TopBar.tsx

│   │   ├── charts/                 # Recharts wrappers (web dashboard only — PDF charts are plain Views)

│   │   │   ├── TrendLineChart.tsx

│   │   │   ├── SentimentDonutChart.tsx

│   │   │   └── ThemeBarChart.tsx

│   │   ├── feedback/

│   │   │   ├── FeedbackCard.tsx

│   │   │   ├── FeedbackFilters.tsx

│   │   │   └── FileDropzone.tsx

│   │   └── settings/

│   │       └── AvatarUpload.tsx

│   │

│   ├── hooks/

│   │   ├── useAuth.ts              # Session + role helpers (identity only — no avatar)

│   │   ├── useAvatar.ts            # Cookie-free avatar store, fetched via /api/profile

│   │   ├── useTheme.ts             # Light/Night theme context

│   │   ├── useToast.ts             # Global toast notifications

│   │   ├── useAsync.ts             # Generic data-fetching state

│   │   ├── useDebounce.ts

│   │   └── usePagination.ts

│   │

│   ├── lib/

│   │   ├── env.ts                  # Validated environment configuration

│   │   ├── errors.ts               # Typed application error hierarchy

│   │   ├── logger.ts               # Structured logging with secret redaction

│   │   ├── responses.ts            # Standardized API response envelope

│   │   ├── utils.ts                # Formatting, className, avatar helpers

│   │   ├── image.ts                # Client-side avatar resize/compression

│   │   ├── db/prisma.ts            # Prisma client singleton

│   │   ├── auth/

│   │   │   ├── auth-options.ts     # NextAuth configuration — deliberately minimal session payload

│   │   │   ├── auth-session.ts     # Server session helper

│   │   │   └── permissions.ts      # requireAuth / requireRole guards

│   │   ├── ai/

│   │   │   ├── groq.ts             # Groq client + structured-output validation

│   │   │   ├── classifier.ts       # Sentiment & theme classification

│   │   │   ├── qa.ts               # Ask HermesX retrieval-augmented Q&A

│   │   │   └── report-narrative.ts # AI report writing

│   │   ├── embeddings/cohere.ts    # Embedding generation & pgvector storage

│   │   ├── retrieval/vector-search.ts  # Workspace-scoped similarity search

│   │   ├── csv/feedback-import.ts  # CSV parsing, bulk import, bounded auto-classification

│   │   ├── pdf/report-pdf.tsx      # 8-page report PDF document layout

│   │   ├── security/

│   │   │   ├── rate-limit.ts

│   │   │   └── request-security.ts # Prompt-injection defenses

│   │   └── validation/             # Zod schemas, one file per resource

│   │       ├── auth.ts

│   │       ├── profile.ts

│   │       ├── users.ts

│   │       ├── workspace.ts

│   │       ├── feedback.ts

│   │       ├── themes.ts

│   │       ├── analytics.ts

│   │       ├── ask-hermesx.ts

│   │       ├── ai.ts               # Batch classification limit

│   │       └── reports.ts

│   │

│   ├── services/api/               # Typed frontend API client, one module per resource

│   │   ├── client.ts                # Axios instance + error normalization

│   │   ├── auth.api.ts

│   │   ├── profile.api.ts

│   │   ├── users.api.ts

│   │   ├── workspace.api.ts

│   │   ├── feedback.api.ts          # Includes classifyBatch()

│   │   ├── themes.api.ts

│   │   ├── analytics.api.ts

│   │   ├── ask.api.ts

│   │   └── reports.api.ts           # Includes downloadReportPdf()

│   │

│   ├── providers/Providers.tsx     # Theme context + NextAuth SessionProvider

│   ├── types/

│   │   ├── index.ts                # Shared DTO contract for every API response

│   │   └── next-auth.d.ts          # Session/JWT type augmentation (identity fields only)

│   └── middleware.ts                # Security headers for all API routes

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

| Run AI classification (single or batch) | ✅ | ✅ | ❌ |

| Use Review Mode | ✅ | ✅ | ❌ |

| Generate and export reports | ✅ | ✅ | ❌ |

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

| `/ai/classify-batch` | POST | Admin/Analyst — processes up to 30 pending items per call |

| `/ask-hermesx` | POST | Any |

| `/reports` | GET, POST | GET: any · POST: Admin/Analyst |

| `/reports/:id` | GET | Any |

| `/reports/:id/pdf` | GET | Any — streams back a generated `application/pdf` |

| `/health` | GET | Public |

Every JSON response follows one of three shapes:

```jsonc

// Success

{ "success": true, "data": { ... } }

// Success, paginated

{ "success": true, "data": [ ... ], "pagination": { "page": 1, "limit": 20, "total": 47, "totalPages": 3 } }

// Error

{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }

```

`/reports/:id/pdf` is the one exception — it returns raw PDF bytes with `Content-Type: application/pdf`, not the JSON envelope above.

---

## Database Schema

| Model | Purpose |

|---|---|

| `Workspace` | Top-level tenant boundary — everything else belongs to exactly one workspace |

| `User` | Workspace members with a role (Admin/Analyst/Viewer), credentials, and an optional profile photo (`avatarUrl`) |

| `Feedback` | A single piece of customer feedback, its channel, and AI-derived sentiment/feature area |

| `Theme` | A named topic/category, unique per workspace |

| `FeedbackTheme` | Many-to-many join between feedback and themes, with a confidence score |

| `Embedding` | A `pgvector` vector representing a feedback item's semantic content |

| `Report` | A generated AI report for a given date range, including its narrative and underlying statistics |

---

## Architecture Notes

- **Multi-tenancy is enforced in code.** Every query touching workspace-owned data is filtered by `workspaceId` derived from a database-verified session — never from a client-supplied value.

- **Sessions are re-verified on every privileged call.** A JWT alone is never trusted for role or workspace membership; the current database record is re-read each time.

- **The session cookie stays small on purpose.** Profile photos (`User.avatarUrl`) are deliberately kept OUT of the NextAuth JWT/session — putting a base64 image in a session cookie means it's sent as an HTTP header on *every* request, and once large enough this causes a hard-to-diagnose `431 Request Header Fields Too Large` error on completely unrelated endpoints. Avatars are instead fetched on demand via `GET /api/profile` and cached client-side in `hooks/useAvatar.ts`, a small store kept outside React Context/cookies entirely.

- **AI failures never lose data.** Feedback is always saved first; classification and embedding generation are best-effort follow-ups that can be safely retried — including via the batch classification endpoint for large backlogs.

- **Reports are honest about incomplete data.** If part of a report's period hasn't been AI-classified yet, `unclassified` is surfaced explicitly (in both the web view and PDF) rather than letting `totalFeedback` and the sentiment breakdown silently disagree.

- **Retrieval is tenant-scoped at the SQL level.** The pgvector similarity search filters by `workspaceId` inside the query itself, not after the fact.

- **Prompt injection is treated as a first-class threat.** All AI inputs derived from user-authored content are wrapped with explicit instructions that they are data, not commands.

- **PDF generation avoids SVG entirely.** The report PDF's charts are built from plain flexbox `View` components (e.g. a proportionally-sized stacked bar using `flex: value`) rather than `@react-pdf/renderer`'s SVG primitives, after two different SVG-based approaches hit the same underlying `pdfkit` compatibility bug. Views/Text are the same primitives used everywhere else in the document, so this is also simply the more proven path.

---

## Known Limitations

- Rate limiting is in-memory per server instance — suitable for blunting casual abuse, not a substitute for a shared store (e.g. Redis) under sustained adversarial load.

- App Store sync generates realistic simulated review data and does not connect to any real App Store API.

- CSV import runs synchronously within a single request and is bounded to 1,000 rows / 5MB per file; only the first 30 imported rows are auto-classified immediately, with the rest picked up by the batch classification action.

- Review Mode's queue is bounded to 20 items per session — a workspace with more unreviewed feedback than that simply starts a new session after finishing the first batch.