# MyGOV Agent 2.0

MyGOV Agent 2.0 is a premium GovTech case-management web app built for a Citizens First hackathon story. It gives citizens one trusted entry point to submit public complaints, flood-related requests, and reminder-driven service cases, while giving admins a protected review workspace to triage, update, and resolve the same live records.

The product is designed around one memorable hero flow:

1. A citizen signs in securely.
2. The citizen creates a real case with evidence uploaded to Firebase Storage.
3. The app writes the case and timeline into Firestore.
4. The citizen sees live tracking on the case detail page.
5. An admin opens the same record, reviews evidence, updates status, and appends real timeline events.

## Why This Matters

Citizen service journeys are often fragmented across agencies, portals, and follow-up loops. That creates repeated submissions, unclear ownership, and poor status visibility.

MyGOV Agent 2.0 addresses that with:

- One no-wrong-door citizen intake surface
- Structured case packets that are easier to route and review
- Live tracking with evidence and timeline history
- Protected admin review workflows with clearer decisions and follow-up actions
- An AI-ready data model that can grow into intake extraction, routing, and grounded policy reasoning later

## Roles

- `citizen`
- `admin`

Admin includes officer-style behavior. There is no third role in the current app.

## Major Features

- Premium landing page and marketing shell with calm civic-tech styling
- Firebase email/password authentication
- Secure server-issued session cookies for authenticated routes
- Strict RBAC with citizen and admin access only
- Live Firestore-backed dashboards, profiles, notifications, queues, and case detail pages
- Live Firebase Storage evidence uploads with progress and real failure states
- Real case creation flow with initial event timeline writes
- Real admin actions for review, routing, request-docs, notes, in-progress, resolve, and reject
- Event timeline rendered from `cases/{caseId}/events/{eventId}`
- Route-level loading, empty, and setup/error states
- AI-ready intake structure for summaries, urgency, missing documents, and future model integration

## Route Map

- `/`
  Marketing landing page
- `/login`
  Firebase login
- `/dashboard`
  Citizen dashboard with live stats and cases
- `/cases/new`
  Live case submission flow
- `/cases/[id]`
  Citizen case detail and real event timeline
- `/notifications`
  User notification center
- `/profile`
  User profile view
- `/admin`
  Admin queue and dashboard
- `/admin/cases/[id]`
  Admin decision center for one case

## Architecture Summary

- `src/app/(marketing)`
  Public landing experience
- `src/app/(auth)`
  Login experience
- `src/app/(app)`
  Protected citizen and admin routes
- `src/app/api/auth`
  Session login and logout handlers
- `src/app/api/cases`
  Case creation and evidence mutation routes
- `src/app/api/admin`
  Admin mutation routes
- `src/components/common`
  Shared UI, skeletons, timeline, cards, headers, and live-data setup states
- `src/components/forms`
  Login, intake, and admin review interactions
- `src/components/layout`
  Marketing shell and app shell
- `src/lib/auth`
  Session reading and role enforcement
- `src/lib/firebase`
  Firebase client/admin setup and config checks
- `src/lib/repositories`
  Live Firestore reads and writes
- `src/lib/actions`
  Client-facing API wrappers
- `src/lib/validation`
  Zod request validation
- `src/hooks`
  Upload state and client workflow helpers
- `src/types`
  Shared app types
- `scripts`
  Seed utility

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- Framer Motion
- Firebase Auth
- Firebase Admin
- Cloud Firestore
- Firebase Storage
- React Hook Form
- Zod
- Lucide React
- class-variance-authority
- Sonner

## Data Model

Primary live collections:

- `users/{uid}`
- `users/{uid}/notifications/{notificationId}`
- `cases/{caseId}`
- `cases/{caseId}/events/{eventId}`
- `cases/{caseId}/subtasks/{subtaskId}` reserved for future use

Notes:

- Citizen dashboards are computed from the user’s live case records.
- Case detail pages read the main case document plus the `events` subcollection.
- Notifications are stored under each user document.
- Evidence metadata is stored on the case document and points to Firebase Storage objects.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in real values.

Required client variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_APP_URL`

Required server variables:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `SESSION_COOKIE_NAME`

How to fill them:

1. Open Firebase Console.
2. Go to Project settings -> General -> Your apps.
3. Copy the Firebase web app config into the `NEXT_PUBLIC_*` variables.
4. Go to Project settings -> Service accounts.
5. Use a Firebase Admin service account for `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
6. Keep `FIREBASE_PRIVATE_KEY` wrapped in quotes and preserve `\n` line breaks exactly.
7. Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` locally and your deployed HTTPS origin in production.

Reference files:

- `.env.example`
- `.env.local.example`

## Firebase Setup

1. Enable Email/Password sign-in in Firebase Authentication.
2. Enable the Cloud Firestore API for the project.
3. Create the Firebase Storage bucket referenced by `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.
4. Create Firestore user documents in `users/{uid}` with at least:

```json
{
  "name": "Aisyah Rahman",
  "role": "citizen"
}
```

```json
{
  "name": "Farid Hakim",
  "role": "admin"
}
```

5. Create matching Firebase Authentication users for those accounts.
6. Optionally mirror the role into Firebase custom claims for faster downstream checks.
7. Deploy:
   - `firestore.rules`
   - `storage.rules`
   - `firestore.indexes.json`

## Current Firebase Console Notes

During live verification against the configured project, two setup blockers were found:

- Cloud Firestore API is disabled for `mygov-d48ef`
- The configured Storage bucket does not currently exist

The app now fails honestly with setup/error states instead of silently showing demo data when those services are unavailable.

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

The app is validated with:

```bash
npm run lint
npm run typecheck
npm run build
```

Note:

- `npm run typecheck` depends on Next’s generated route types being present in `.next/types`
- In normal workflow this is fine after a build or dev run

## Firestore and Storage Notes

- Firestore is the source of truth for users, cases, timelines, admin actions, and notifications
- Storage is the source of truth for uploaded evidence files
- The app no longer silently falls back to runtime demo data
- Upload failure does not pretend success
- Admin actions append live case events and write live user notifications

## Demo Flow

Recommended hackathon demo:

1. Sign in as a citizen.
2. Create a flood relief or public complaint case.
3. Upload one or more evidence files.
4. Submit and land on the real `/cases/[id]` page.
5. Show the live event timeline and evidence metadata.
6. Sign in as an admin.
7. Open the same case in `/admin/cases/[id]`.
8. Add an internal note, request more documents, route, or resolve.
9. Return to the citizen view and show the updated live case history.

Short proof flow:

- Open `/notifications` to show user-level follow-up notifications

Roadmap moment:

- Show how reminder-driven flows can become proactive cases later

## Seed Support

If you want starter user documents for a new Firebase project:

```bash
npm run seed
```

The seed script currently creates starter `users` records only. It is a setup helper, not a runtime fallback path.

## AI Roadmap

The app is intentionally AI-ready without overbuilding the AI layer yet.

Planned integrations:

- Gemini 2.5 Flash-Lite for intake JSON extraction
- Gemini 2.5 Flash for reasoning and summary generation
- Document AI for document extraction
- Maps and Geocoding for normalized location data
- RAG for grounded policy and eligibility guidance
- Agent-style orchestration for intake, routing, and reminders later

The current data model already leaves room for:

- structured intake JSON
- citizen summary
- admin summary
- missing document checklist
- urgency and category fields

## AI Usage Disclosure

The current app does not yet call Gemini or Document AI in production flows. AI-related fields are scaffolds and product-shape decisions only. No hidden AI outputs are being presented as live model results in the current build.

## Deployment Notes

- Vercel is a practical hosting target for the Next.js app
- Add all Firebase client and admin variables to the deployment environment
- Use HTTPS in production so session cookies stay secure
- Add the deployed domain to Firebase Authentication authorized domains
- Confirm Firestore API and Storage bucket are enabled before demo day

## Git Workflow Notes

This repo is already connected to GitHub and `main` is pushed.

Milestone-based workflow used in this build:

- commit after each major feature phase
- run validation before pushing
- keep commit messages clean and product-oriented

Recent milestone commits:

- `refactor: require live firebase data and remove fallback mode`
- `feat: finalize live case creation and event timeline`
- `feat: harden admin review actions and queue states`
- `feat: polish loading empty and error states`

## Demo Credentials

Use real Firebase Authentication users.

Placeholders:

- Citizen: `citizen@your-project.test`
- Admin: `admin@your-project.test`

Role access comes from Firebase custom claims or `users/{uid}.role`.

## Screenshot Placeholders

- `docs/screenshots/landing-page.png`
- `docs/screenshots/login.png`
- `docs/screenshots/citizen-dashboard.png`
- `docs/screenshots/create-case.png`
- `docs/screenshots/case-detail.png`
- `docs/screenshots/admin-queue.png`
- `docs/screenshots/admin-review.png`
