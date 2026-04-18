# MyGOV Agent 2.0

MyGOV Agent 2.0 is a premium GovTech web application built for hackathon delivery with production-style structure. It gives citizens one trusted entry point for multimodal case intake and unified tracking, while giving admins a protected review workspace with cleaner evidence context, structured summaries, and clearer decision controls.

## Problem Statement

Citizen service journeys are often fragmented across portals, departments, and follow-up loops. That leads to duplicated submissions, slow routing, and unclear status visibility. MyGOV Agent 2.0 addresses that by combining:

- Multimodal intake for text, photo, document, and voice-note-first reporting
- Structured case packets that are easier to route and review
- Clear citizen tracking with reminders and timeline updates
- Protected admin workflows for review, routing, and resolution

## Roles

- `citizen`
- `admin`

Admin includes officer capabilities. All internal review surfaces are protected under `/admin`.

## Major Features

- Premium landing page with a polished civic-tech visual system
- Firebase email/password authentication
- Secure server-side session cookies for authenticated app routes
- Role-based access protection for citizen and admin experiences
- Firestore-backed repositories for users, cases, case events, and notifications
- Citizen dashboard, notifications, profile, case intake, and case tracking
- Admin queue with search and status filters
- Admin decision center with evidence, summaries, notes, and action controls
- AI-ready intake scaffold with category, urgency, missing-doc checklist, and summaries
- Firestore and Storage rules starter files reflecting role-aware access patterns

## Architecture Summary

- `src/app/(marketing)`
  Public landing experience
- `src/app/(auth)`
  Login experience
- `src/app/(app)`
  Protected product routes for citizens and admins
- `src/app/api/auth`
  Session login and logout handlers
- `src/app/api/cases`
  Case creation and evidence write routes
- `src/app/api/admin`
  Admin mutation routes
- `src/components/common`
  Shared UI such as status badges, timeline, cards, and headers
- `src/components/forms`
  Auth, intake, and admin review interactions
- `src/components/layout`
  Marketing shell, app frame, sidebar, topbar, and mobile nav
- `src/lib/auth`
  Session reading and role enforcement helpers
- `src/lib/actions`
  Client-facing API wrappers
- `src/lib/firebase`
  Firebase client, admin, and role helpers
- `src/lib/repositories`
  Firestore-backed reads and writes with explicit live-data setup and error handling
- `src/lib/validation`
  Zod validation schemas
- `src/hooks`
  Client upload state hooks

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- Framer Motion
- Firebase Auth
- Firebase Admin
- Firestore
- Firebase Storage
- React Hook Form
- Zod
- Lucide React
- class-variance-authority
- Sonner

## Environment Setup

Use `.env.example` as the committed reference and copy `.env.local.example` to `.env.local` for local development.

Required variables:

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
- `NEXT_PUBLIC_APP_URL`

How to fill them:

1. Open Firebase Console.
2. Go to Project settings -> General -> Your apps.
3. Copy the web app config values into the `NEXT_PUBLIC_*` variables.
4. Go to Project settings -> Service accounts.
5. Generate or use an existing service account and copy the project id, client email, and private key into the `FIREBASE_*` variables.
6. Keep the private key wrapped in quotes and preserve `\n` line breaks as shown in `.env.local.example`.
7. Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` locally and to your deployed HTTPS origin in production.

No secrets are hardcoded in the application source. Firebase config is read from environment variables in `src/lib/firebase`.

## Firebase Setup

1. Enable Email/Password sign-in in Firebase Authentication.
2. Enable the Cloud Firestore API for the Firebase project.
3. Provision the Firebase Storage bucket referenced by `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.
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

5. Optionally mirror the role into Firebase custom claims for faster downstream rule checks.
6. Apply `firestore.rules`, `storage.rules`, and `firestore.indexes.json`.
7. Add matching test accounts in Firebase Authentication.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Quality checks used in this repo:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Demo Credentials

Use real Firebase Authentication users for demos.

- Citizen account placeholder: `citizen@your-project.test`
- Admin account placeholder: `admin@your-project.test`

Role access is determined by Firebase custom claims or Firestore `users/{uid}.role`.

## Seed Support

If you need starter user documents for a new Firebase project:

```bash
npm run seed
```

This seeds the `users` collection using the current Firebase Admin environment variables.

## AI Usage Disclosure

The current build does not directly call Gemini yet. It prepares the app for future AI integration by structuring intake data, citizen summaries, admin summaries, urgency, and missing-document scaffolds so a later AI layer can plug in cleanly.

## Deployment Notes

- Vercel is a practical target for the Next.js frontend.
- Add all Firebase Admin and client variables in deployment environment settings.
- Use HTTPS in production so session cookies behave securely.
- Make sure the deployed domain is added to Firebase Authentication authorized domains.

## Git Workflow Notes

- The repo now tracks `main` on GitHub.
- Each completed milestone is committed with a meaningful message and pushed immediately.
- Validation is run before milestone commits whenever changes affect the shipped app.

## Screenshots

- `docs/screenshots/landing-page.png` - placeholder
- `docs/screenshots/citizen-dashboard.png` - placeholder
- `docs/screenshots/create-case-flow.png` - placeholder
- `docs/screenshots/admin-queue.png` - placeholder
- `docs/screenshots/admin-review.png` - placeholder

## Current Milestones

- `chore: initialize next.js app shell`
- `feat: add auth, RBAC, and core citizen-admin app flows`
- `feat: add profile and notification center scaffolds`
- `feat: harden firebase auth and refine case workflows`
- `feat: polish motion and responsive app shell`
