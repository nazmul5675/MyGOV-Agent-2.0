# MyGOV Agent 2.0

MyGOV Agent 2.0 is a polished GovTech prototype built for hackathon demos. The product centers on four pillars:

- AI helping chat
- file and document management
- citizen dashboard command center
- admin operations dashboard

The app is intentionally optimized for demo reliability:

- prototype JSON data powers the main workflows
- Gemini powers the assistant when `GEMINI_API_KEY` is configured
- the UI stays premium, responsive, and presentation-safe
- auth and navigation are tuned for immediate workspace entry

## Problem Statement

Citizen service journeys are often fragmented across multiple forms, agencies, and document requests. That creates:

- repeated submissions
- weak visibility into case status
- poor document handling
- unclear next steps for citizens
- slow review cycles for officers and admins

MyGOV Agent 2.0 presents one trusted entry point where citizens can submit evidence, ask for AI guidance, track progress, and receive clearer follow-up. Admins see the same case as an operational workspace instead of a disconnected backlog.

## Why This Matters for GovTech

- Citizens need a no-wrong-door service entry, not a maze.
- Public-sector teams need better intake quality and faster triage.
- Document handling and status tracking should feel like one system.
- AI should support real service workflows, not sit beside them as a gimmick.

## Roles

- `citizen`
- `admin`

Admin includes officer-style capabilities. There is no third role.

## Demo Story

1. A citizen signs in with a stable prototype account.
2. The citizen lands on `/dashboard` and sees active cases, files, reminders, and AI guidance.
3. The citizen asks Gemini what documents are needed.
4. The citizen creates a case, uploads files through the polished prototype upload flow, and submits.
5. The citizen opens `/cases/[id]` to track status, timeline events, reminders, and missing documents.
6. An admin signs in, opens `/admin`, and reviews the same packet.
7. The admin updates file review states, requests more documents, routes the case, or resolves it.
8. The citizen view reflects the updated status and activity trail.

## Major Features

- premium landing page and protected app shell
- prototype JSON-backed dashboards, cases, files, notifications, reminders, and chat seeds
- stable citizen and admin login flow with server-checked sessions
- registration, forgot-password, password visibility toggles, and profile basics
- citizen dashboard with active-case context, uploaded files, reminders, next actions, and AI help
- case workspace with status, timeline, files, reminders, and contextual assistant chat
- admin dashboard with queue visibility, file review focus, recent activity, and AI-ready guidance
- admin case review workspace with evidence states, internal notes, action controls, and timeline
- Gemini-backed assistant route when `GEMINI_API_KEY` is present
- graceful assistant fallback when Gemini is not configured

## Product Pillars

### AI Helping Chat

- reusable assistant panel on dashboard and case detail
- suggested prompts
- context-aware replies using selected case and file metadata
- citizen-friendly and admin-friendly guidance
- real Gemini integration through `src/lib/ai/gemini.ts`

### File and Document Management

- upload queue with progress
- file cards with kind, status, size, and time
- admin evidence review states
- missing-document visibility
- evidence manager reused across citizen and admin surfaces

### Citizen Dashboard

- greeting and active-case overview
- create case CTA
- AI helping chat
- uploaded files overview
- next actions
- reminders and notifications
- recent timeline activity

### Admin Dashboard

- queue overview
- pending review signals
- file review block
- recent operations activity
- action-ready case cards
- AI-ready operational guidance

## Route Map

### Public

- `/`
- `/login`
- `/register`
- `/forgot-password`

### Citizen

- `/dashboard`
- `/cases/new`
- `/cases/[id]`
- `/notifications`
- `/profile`

### Admin

- `/admin`
- `/admin/cases/[id]`

## Prototype Data Strategy

Runtime product data now comes from centralized JSON files under `src/data/prototype`:

- `users.json`
- `cases.json`
- `case-events.json`
- `files.json`
- `notifications.json`
- `reminders.json`
- `chat-seeds.json`

This data is loaded into an in-memory prototype store at server startup through:

- `src/lib/prototype/store.ts`

The store is intentionally presentation-focused:

- consistent across dashboard, case detail, files, notifications, and admin review
- realistic Malaysian GovTech-style content
- supports a clean judge-friendly end-to-end flow
- resets when the server restarts

Current seeded coverage:

- 3 citizen users
- 1 admin user
- 7 cases across mixed statuses
- linked file metadata, reminders, notifications, and assistant chat seeds
- multiple timeline events per case for a smoother demo story

Data selectors and mutations are centralized in:

- `src/lib/prototype/repository.ts`

### How to Update Prototype Data

1. Edit the relevant JSON file in `src/data/prototype`.
2. Keep IDs and cross-references aligned across `cases.json`, `files.json`, `case-events.json`, `notifications.json`, `reminders.json`, and `chat-seeds.json`.
3. Restart the dev server if you want a fully fresh in-memory state.
4. If you create a new case type or field, update the matching TypeScript types and repository mapping logic.

## Demo Accounts

Seeded prototype accounts:

- Citizen: `aisyah.rahman@mygov-demo.my` / `DemoCitizen123`
- Citizen: `farid.hassan@mygov-demo.my` / `DemoCitizen123`
- Citizen: `siti.zulaikha@mygov-demo.my` / `DemoCitizen123`
- Admin: `amir.fauzi@mygov-demo.my` / `DemoAdmin123`

These accounts live in `src/data/prototype/users.json`.

## Architecture Summary

- `src/app/(marketing)`
  Public product shell
- `src/app/(auth)`
  Login, register, forgot-password
- `src/app/(app)`
  Protected citizen and admin routes
- `src/app/api/auth`
  Demo-safe auth/session routes
- `src/app/api/cases`
  Case creation and evidence attachment APIs
- `src/app/api/admin`
  Admin case actions and file review APIs
- `src/app/api/assistant`
  Assistant message handling
- `src/data/prototype`
  Centralized prototype JSON data
- `src/lib/prototype`
  In-memory prototype store
- `src/lib/repositories`
  Data access layer
- `src/lib/ai`
  Gemini integration
- `src/lib/auth`
  Session helpers and route protection
- `src/lib/validation`
  Zod schemas
- `src/components/common`
  Shared assistant, evidence, status, timeline, and layout building blocks
- `src/components/admin`
  Admin queue and evidence review modules
- `src/components/forms`
  Auth, profile, intake, and admin action forms

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- Framer Motion
- Zod
- React Hook Form
- Lucide React
- Sonner
- Jose
- optional Firebase client/admin configuration still available for future live mode
- Gemini API for the assistant layer

## Session and Auth Mode

The current default mode is:

- `NEXT_PUBLIC_APP_MODE=prototype`

In prototype mode:

- login uses seeded credentials from the prototype store
- register creates a new in-memory citizen account for the running session
- forgot-password uses a clean simulated recovery flow
- session cookies are still server-checked
- citizen users land on `/dashboard`
- admin users land on `/admin`

The mode switch lives in:

- `src/lib/config/app-mode.ts`

## AI Assistant

The assistant route lives at:

- `src/app/api/assistant/messages/route.ts`

Gemini integration lives at:

- `src/lib/ai/gemini.ts`

Current behavior:

- if `GEMINI_API_KEY` exists, the assistant sends real context-aware requests to Gemini
- if `GEMINI_API_KEY` is missing, the UI still works and falls back to a local guidance layer
- case context includes status, summaries, missing documents, and file metadata
- dashboard context uses seeded history and current user context

Suggested prompt starters:

- What documents do I need?
- Help me explain my issue
- Summarize my uploads
- What should I do next?
- Why is my case still under review?
- Draft an officer summary for this case

## File Management

Citizen-side file handling includes:

- upload queue
- progress transitions
- file kind and size
- upload/remove before submission
- evidence organization in dashboard and case detail

Admin-side file handling includes:

- evidence review panel
- file review state updates
- better-copy and more-documents workflow support
- grouped evidence visibility inside the case workspace

In prototype mode, file uploads use a polished simulated upload path so the demo remains stable while still feeling like a real file-management experience.

## Data Model Shape

Primary product entities:

- users
- cases
- case events
- files
- notifications
- reminders
- assistant messages

Prototype case records preserve the same practical shape we would use in live mode:

- case summary
- status
- intake summaries
- urgency
- missing documents
- assigned unit
- latest internal note
- evidence metadata
- event timeline

## Environment Setup

Copy `.env.local.example` to `.env.local`.

Prototype-first variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_MODE`
- `APP_SESSION_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Optional Firebase variables for future live mode:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SESSION_COOKIE_NAME`

### Recommended Local Prototype Values

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_MODE=prototype
APP_SESSION_SECRET=replace-with-a-long-random-string
GEMINI_API_KEY=replace-with-your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash-lite
SESSION_COOKIE_NAME=mygov_session
```

## Gemini Setup

1. Create a Gemini API key in Google AI Studio.
2. Add it to `.env.local` as `GEMINI_API_KEY`.
3. Keep `GEMINI_MODEL=gemini-2.5-flash-lite` unless you intentionally want a different model.
4. Restart the dev server.

If Gemini is unavailable at runtime, the assistant falls back to the local prototype guidance layer so the demo does not break.

## Demo Checklist

Recommended presentation flow:

1. Sign in as `aisyah.rahman@mygov-demo.my`.
2. Open `/dashboard` and show the active case overview, file readiness, reminders, and AI helping chat.
3. Ask Gemini what documents are needed or to summarize uploaded files.
4. Open `/cases/case-flood-shah-alam` to show timeline, missing documents, file review states, and mapped location context.
5. Switch to the admin account `amir.fauzi@mygov-demo.my`.
6. Open `/admin` to show the queue, AI summary cards, and pending file review surface.
7. Open `/admin/cases/case-flood-shah-alam` and demonstrate evidence review, internal notes, admin actions, and the AI review helper.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run seed
```

## Validation

Run after each major milestone:

```bash
npm run lint
npm run typecheck
npm run build
```

## README Notes for Judges and Reviewers

This build is intentionally a polished prototype:

- the product experience is stable and presentation-ready
- the UI and flows behave like a real service platform
- the core data is seeded from structured JSON for reliability
- Gemini is the live intelligence layer once the key is configured
- the architecture is still organized so live integrations can be swapped back in later

## AI Usage Disclosure

- prototype case, file, timeline, notification, and reminder data are seeded
- assistant prompts and context are real
- Gemini responses are real when `GEMINI_API_KEY` is configured
- if Gemini is not configured, the app falls back gracefully to a local guidance responder so the demo does not break
- the app does not claim production deployment of Document AI, grounding, or full policy automation yet

## Deployment Notes

- Vercel is a practical deployment target
- set `NEXT_PUBLIC_APP_MODE=prototype` for the presentation build
- set `APP_SESSION_SECRET`
- set `GEMINI_API_KEY`
- do not ship `.env.local`, `.git`, `.next`, or `node_modules`

## Submission Packaging

Do not include these in the handoff zip:

- `.env`
- `.env.local`
- `.git`
- `.next`
- `node_modules`
- cache folders
- build artifacts

## Git Workflow Notes

The repo is connected to GitHub and milestone work is committed and pushed incrementally.

## Screenshot Placeholders

- `docs/screenshots/landing-page.png`
- `docs/screenshots/login.png`
- `docs/screenshots/register.png`
- `docs/screenshots/citizen-dashboard.png`
- `docs/screenshots/create-case.png`
- `docs/screenshots/case-workspace.png`
- `docs/screenshots/admin-dashboard.png`
- `docs/screenshots/admin-review.png`
