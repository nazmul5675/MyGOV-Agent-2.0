# MyGOV Agent 2.0

MyGOV Agent 2.0 is a live Firebase-backed GovTech platform built for a Citizens First hackathon demo. It combines AI-assisted guidance, structured case intake, document management, citizen-facing tracking, and an admin operations console in one polished Next.js application.

The core product story is simple and memorable:

1. A citizen signs in or creates an account.
2. The citizen uploads evidence, asks the embedded assistant what is missing, and submits a real case.
3. Firestore stores the case, file metadata, notifications, chat history, and event timeline.
4. The citizen tracks the same live case from the dashboard and case workspace.
5. An admin opens the same record, reviews files, updates status, adds notes, and appends live events.

## Problem Statement

Citizen service journeys are often fragmented across multiple portals, agencies, and document requests. That creates:

- repeated submissions
- unclear case ownership
- poor visibility into status updates
- weak document handling
- avoidable friction for both citizens and officers

MyGOV Agent 2.0 focuses on one trusted entry point with clearer guidance, cleaner evidence handling, and a more operational admin experience.

## Why This Matters for GovTech

- Citizens need a no-wrong-door experience, not a maze of forms.
- Officers need structured intake, visible documents, and clearer next-step cues.
- AI should support real workflows, not sit beside them as a novelty.
- Document handling and case tracking should feel like one system.

## Roles

- `citizen`
- `admin`

Admin includes officer-style capabilities. There is no third role.

## Product Pillars

- AI helping chat box
- File and document management
- Citizen dashboard command center
- Admin operations dashboard and review workspace

## Major Features

- Premium landing page and protected app shell
- Firebase email/password authentication
- Registration, forgot-password, password visibility toggles, and profile basics
- Server-issued session cookies for protected routes
- Strict RBAC for `citizen` and `admin`
- Live Firestore-backed dashboards, profiles, notifications, cases, files, timelines, and chat messages
- Firebase Storage uploads with progress, cleanup, and real failure states
- Citizen case creation with real evidence metadata persistence
- Case-linked and dashboard-level assistant chat scaffolding
- Admin queue, decision actions, internal notes, and evidence review tools
- Timeline rendering from `cases/{caseId}/events/{eventId}`
- Loading, empty, setup-error, and success states across live routes

## Hero Demo Flow

1. Register a citizen account.
2. Sign in and land on `/dashboard`.
3. Ask the AI helper what documents are needed.
4. Start `/cases/new`, upload evidence, and submit a live case.
5. Open `/cases/[id]` to show files, reminders, assistant context, and timeline.
6. Sign in as an admin and open `/admin`.
7. Review the same case in `/admin/cases/[id]`.
8. Mark files, add notes, request more documents, route, or resolve.
9. Return to the citizen view and show the updated live history.

## Route Map

### Public

- `/`
  Marketing landing page
- `/login`
  Firebase login
- `/register`
  Citizen registration
- `/forgot-password`
  Firebase password reset flow

### Citizen

- `/dashboard`
  Live citizen command center with stats, files, reminders, activity, and AI help
- `/cases/new`
  Guided live case intake with uploads
- `/cases/[id]`
  Citizen case workspace with status, files, timeline, reminders, and assistant chat
- `/notifications`
  Live notification center
- `/profile`
  Firestore-backed profile basics and onboarding completion

### Admin

- `/admin`
  Operations dashboard with queue, file review signals, and recent activity
- `/admin/cases/[id]`
  Admin review workspace with evidence tools, status actions, notes, timeline, and assistant help

## Architecture Summary

- `src/app/(marketing)`
  Public product and positioning shell
- `src/app/(auth)`
  Login, register, forgot-password
- `src/app/(app)`
  Protected citizen and admin routes
- `src/app/api/auth`
  Login, logout, registration session exchange
- `src/app/api/cases`
  Live case creation and evidence metadata APIs
- `src/app/api/admin`
  Admin actions and file review APIs
- `src/app/api/assistant`
  Assistant chat message persistence and response scaffold
- `src/components/auth`
  Reusable auth shell and field helpers
- `src/components/common`
  Shared dashboard, evidence, assistant, timeline, and skeleton components
- `src/components/admin`
  Queue and evidence-review admin surfaces
- `src/components/forms`
  Case intake, login, register, forgot-password, profile, and review forms
- `src/lib/auth`
  Session reading and route protection
- `src/lib/firebase`
  Firebase client/admin setup
- `src/lib/repositories`
  Firestore reads and writes
- `src/lib/actions`
  Client API wrappers
- `src/lib/validation`
  Zod schemas
- `src/hooks`
  Live upload state handling
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
- Sonner

## Live Data Model

Primary collections and subcollections:

- `users/{uid}`
- `users/{uid}/notifications/{notificationId}`
- `users/{uid}/assistantThreads/dashboard/messages/{messageId}`
- `cases/{caseId}`
- `cases/{caseId}/events/{eventId}`
- `cases/{caseId}/files/{fileId}`
- `cases/{caseId}/chat/{messageId}`
- `cases/{caseId}/subtasks/{subtaskId}` reserved for future use

### Auth Fields vs Profile Fields

Firebase Auth stores only authentication credentials:

- email
- password

Firestore `users/{uid}` stores product profile data:

- `uid`
- `fullName`
- `email`
- `role`
- `dateOfBirth`
- `phoneNumber`
- `addressText`
- `createdAt`
- `updatedAt`

`dateOfBirth` is stored instead of raw age because age changes over time and would become stale.

### Case Shape

Case documents currently include:

- reference
- title
- type
- status
- location
- summary
- citizen identity fields
- progress
- reminders
- intake summaries
- latest internal note

### File Metadata Shape

File records and mirrored evidence summaries include fields such as:

- `id`
- `caseId`
- `ownerUid`
- `storagePath`
- `name`
- `kind`
- `contentType`
- `sizeBytes`
- `uploadedAt`
- `status`
- `category`
- `notes`

## AI-Assisted Workflow Shape

The current assistant is intentionally practical and transparent:

- dashboard-level assistant chat persists to Firestore
- case-linked assistant chat persists to Firestore
- responses are scaffolded and context-aware
- the UI and data model are ready for future model integration

Planned integration path:

- Gemini 2.5 Flash-Lite for intake extraction and lightweight guidance
- Gemini 2.5 Flash for reasoning and summaries
- Document AI for document extraction
- Maps/Geocoding for location normalization
- RAG for grounded policy responses

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
- `SESSION_COOKIE_NAME`

How to fill them:

1. Open Firebase Console.
2. Go to Project settings -> General -> Your apps.
3. Copy the Firebase web app config into the `NEXT_PUBLIC_*` variables.
4. Go to Project settings -> Service accounts.
5. Copy the service account `project_id`, `client_email`, and `private_key`.
6. Keep `FIREBASE_PRIVATE_KEY` wrapped in quotes and preserve `\n` line breaks.
7. Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` locally.

Reference files:

- `.env.example`
- `.env.local.example`

## Firebase Console Setup

1. Enable Email/Password sign-in in Firebase Authentication.
2. Enable the Cloud Firestore API.
3. Create the Firebase Storage bucket referenced by the web config.
4. Add real Firebase Auth users.
5. Ensure matching `users/{uid}` docs exist with:

```json
{
  "fullName": "Aisyah Rahman",
  "email": "citizen@example.com",
  "role": "citizen"
}
```

```json
{
  "fullName": "Farid Hakim",
  "email": "admin@example.com",
  "role": "admin"
}
```

6. Optionally mirror the role into Firebase custom claims.
7. Deploy:
   - `firestore.rules`
   - `storage.rules`
   - `firestore.indexes.json`

## Important Live Setup Notes

The app no longer silently falls back to demo data. If Firebase services are unavailable, the UI now shows explicit setup or error states.

During live verification against the configured Firebase project, these console blockers were found:

- Cloud Firestore API was disabled for `mygov-d48ef`
- The configured Storage bucket did not yet exist

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

Note: `npm run typecheck` may depend on Next-generated route types in `.next/types`, so a recent `next build` or `next dev` keeps that stable.

## File and Storage Notes

- Files are uploaded to Firebase Storage
- File metadata is stored in Firestore
- Upload failures do not pretend success
- Admin file review writes back to Firestore and appends case events
- Citizens and admins see the same live evidence trail from different surfaces

## Registration and Account Onboarding

The auth experience now supports:

- citizen registration
- secure login
- forgot password
- password visibility toggles
- profile completion on `/profile`

Registration flow:

1. Create Firebase Auth email/password account.
2. Exchange the ID token with the server.
3. Create `users/{uid}` in Firestore with role `citizen`.
4. Issue a secure session cookie.
5. Redirect to profile completion.

Forgot password flow:

- Uses Firebase Auth password reset email
- Shows explicit success and error states
- Does not expose role or profile details

## Seed Support

If you need starter Firebase user documents:

```bash
npm run seed
```

Seed data is a setup utility only. It is not used as runtime fallback.

## AI Usage Disclosure

The current build does not claim to run Gemini or Document AI in production. The assistant is a live, persisted, AI-ready scaffold with case and file context, designed to plug into future model workflows cleanly.

## Deployment Notes

- Vercel is a practical host for the Next.js app
- Add all Firebase client and admin environment variables
- Add the deployed domain to Firebase Authentication authorized domains
- Use HTTPS in production for secure session cookies
- Confirm Firestore API, Storage bucket, and rules deployment before demo day

## Git Workflow Notes

The repo is connected to GitHub and `main` is actively pushed after milestone work.

Recent milestone commits:

- `feat: add ai assistant and file management surfaces to citizen flow`
- `feat: improve live case workspace with uploads chat and timeline`
- `feat: upgrade admin dashboard and evidence management workflow`
- `feat: polish auth basics forms and user-friendly interactions`

## Demo Credentials

Use real Firebase Auth users.

Suggested placeholders:

- Citizen: `citizen@your-project.test`
- Admin: `admin@your-project.test`

## Screenshot Placeholders

- `docs/screenshots/landing-page.png`
- `docs/screenshots/login.png`
- `docs/screenshots/register.png`
- `docs/screenshots/citizen-dashboard.png`
- `docs/screenshots/create-case.png`
- `docs/screenshots/case-workspace.png`
- `docs/screenshots/admin-dashboard.png`
- `docs/screenshots/admin-review.png`
