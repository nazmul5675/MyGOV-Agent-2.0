# MyGOV Agent 2.0

MyGOV Agent 2.0 is a GovTech case-management app built in a single Next.js App Router repo. It runs in one live mode only: Firebase Auth for identity, MongoDB for application data, MongoDB GridFS for uploaded files, and Gemini for server-side AI assistance.

## Hackathon Alignment

- Hackathon: `PROJECT 2030: MyAI Future Hackathon`
- Selected track: `Track 2 - Citizens First (GovTech & Digital Services)`
- Core challenge addressed: reducing bureaucratic friction in citizen service delivery, case intake, document verification, and follow-up communication
- Malaysia relevance: the project focuses on end-to-end digital public-service workflows, clearer status visibility, and document-driven case handling that fits real local government service needs including complaints, reminders, renewals, and flood-related aid workflows
- Build With AI position: Gemini is used as a live server-side intelligence layer for case-aware guidance, summaries, document-context help, and next-step support for both citizens and admins

## Problem

Many public-service flows still create friction for citizens and staff:

- citizens are often unsure where to start, what documents are needed, and what happens next
- manual case handling leads to repeated questions, delayed reviews, and poor status visibility
- document-heavy service requests can become especially stressful during time-sensitive situations such as flood-related support cases
- admins need a clearer triage and review workspace to move cases forward without losing context

MyGOV Agent 2.0 is designed to reduce that friction with one shared live case record across citizen and admin experiences.

## Solution

MyGOV Agent 2.0 provides:

- a guided citizen case-submission flow
- live evidence upload and review tracking
- citizen dashboards that make the next step clear
- an admin operations dashboard and review workspace for queue-based triage
- server-side Gemini assistance grounded in live case, file, and workflow context

The product goal is simple: help citizens submit and follow a case with confidence while giving public-service teams a clearer way to review, request documents, and decide next actions.

Hero flow:

`citizen login -> dashboard -> upload evidence -> create/open case -> AI help -> admin review -> status update -> citizen sees live change`

## Live App

Live hosting link: https://mygov-agent-2-0-526785154511.asia-southeast1.run.app/

### Test Accounts

Use the following test accounts to explore both sides of the platform:

Citizen portal:
- Email: `nazmulhasandh@gmail.com`
- Password: `nazmulhasandh@gmail.com1`

Admin console:
- Email: `first.admin@mygov.local`
- Password: `Admin12345!`

## Tech Stack

- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS and Lucide Icons
- Authentication: Firebase Auth with server-side verification via Firebase Admin
- Database: MongoDB
- File Storage: MongoDB GridFS
- AI: Google Gemini, server-side only
- Maps: Leaflet and OpenStreetMap
- Validation: Zod

## Why AI Is Core To The Product

This project is not using AI as a decorative chatbot. Gemini is part of the core service workflow:

- citizens can ask what to do next, what documents are needed, and how to understand case status
- admins receive case-aware support while reviewing files, missing documents, and next decisions
- prompts are built from live case summaries, evidence state, workflow history, and missing-document context
- the assistant is designed to reduce uncertainty, repeated back-and-forth, and low-quality submissions

Current implementation notes:

- Gemini is implemented server-side only
- the assistant works on live application context rather than static demo content
- the live deployment runs on Google Cloud Run
- this repository currently centers on Gemini-based intelligence and workflow guidance; it does not yet include Vertex AI Search or Firebase Genkit orchestration in the production codebase

## Runtime Architecture

- `src/app/api/*`: route handlers
- `src/lib/auth/*`: session and identity helpers
- `src/lib/config/*`: environment checks
- `src/lib/security/*`: errors and authorization helpers
- `src/lib/repositories/*`: MongoDB data access
- `src/lib/services/*`: business logic
- `src/lib/storage/gridfs.ts`: GridFS upload, delete, and download helpers
- `src/lib/ai/*`: Gemini prompts and model calls
- `src/lib/audit/*`: audit helpers
- `src/lib/validation/*`: Zod schemas
- `src/types/*`: typed document models

There is no separate Express backend, no Firestore dependency, no Firebase Storage dependency in the upload flow, and no runtime demo or prototype mode.

## Role Model

Supported roles:

- `citizen`
- `admin`

Rules:

- public registration always creates `citizen`
- admin cannot self-register publicly
- citizen routes resolve to `/dashboard`
- admin routes resolve to `/admin`
- role is resolved from MongoDB user records, not client-selected state
- role changes are admin-only and written to `role_audit_logs`
- self-demotion and last-admin removal are blocked

## Data Boundaries

- Firebase Auth: client sign-in, registration, password reset
- Firebase Admin: verify ID tokens, create and verify session cookies
- MongoDB: users, cases, case events, file metadata, notifications, reminders, chat, admin notes, role audit logs
- MongoDB GridFS: uploaded evidence blobs
- Gemini: live server-side assistant responses

If MongoDB, GridFS, Firebase Admin, or Gemini are unavailable, the app returns honest empty or failure states instead of switching to fake content.

## Current Backend Capabilities

### Auth

- Firebase ID token exchange in `/api/auth/login`
- server-issued session cookie for protected routes
- Mongo-backed app user resolution by `firebaseUid`
- citizen/admin protected routing

### Cases And Timeline

- citizen case creation
- citizen own-case reads
- admin queue reads
- admin case detail reads
- admin case actions
- automatic `case_events` writes for creation, uploads, status changes, doc requests, and review actions

### Files

- uploads flow through `POST /api/uploads`
- blobs are stored in GridFS
- metadata is stored in MongoDB
- file streaming uses `GET /api/files/[id]`
- admin review updates write review status and notes back to MongoDB

### AI Layer

- Gemini runs server-side only
- case-aware prompts include summaries, status, files, and missing docs
- assistant failures return explicit unavailable errors instead of simulated replies

## GovTech Impact

This project is aimed at practical public-service outcomes:

- clearer citizen intake reduces incomplete submissions
- file review and missing-document handling reduce manual follow-up loops
- live dashboards improve status transparency for both sides
- admin queue and review flows improve triage speed and decision clarity
- a shared record of cases, files, notes, reminders, and events supports more accountable digital service delivery

Potential real-world value:

- better accessibility for citizens who need digital-first government support
- lower case-handling friction for document-driven service workflows
- improved response coordination for recurring public-service issues and crisis-related requests
- stronger trust through honest live status, file review state, and clear next-step guidance

## Route Overview

Public routes:

- `/`
- `/login`
- `/register`
- `/forgot-password`

Citizen routes:

- `/dashboard`
- `/cases/new`
- `/cases/[id]`
- `/notifications`
- `/profile`

Admin routes:

- `/admin`
- `/admin/cases/[id]`
- `/admin/users`

Backend routes:

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/logout`
- `/api/cases`
- `/api/cases/[id]`
- `/api/cases/[id]/evidence`
- `/api/uploads`
- `/api/files/[id]`
- `/api/admin/cases/[id]/actions`
- `/api/admin/cases/[id]/files`
- `/api/admin/users/[id]/role`
- `/api/assistant/messages`
- `/api/users`
- `/api/notifications`
- `/api/profile`
- `/api/health`

## Environment Variables

Use `.env.local` for local development. Never commit real values.

Required app vars:

- `NEXT_PUBLIC_APP_URL`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `GRIDFS_BUCKET_NAME`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `SESSION_COOKIE_NAME`

Firebase client auth vars:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Firebase admin verification vars:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Local Setup

```bash
npm install
npm run dev
```

Validation:

```bash
npm run lint
npm run typecheck
npm run build
```

Optional admin bootstrap:

```bash
npm run seed:admin -- --email admin@example.com --password "StrongPass123!" --name "First Admin"
```

## AI Tooling Disclosure

AI-assisted development tools were used during the hackathon workflow for implementation support and iteration. The team remains responsible for the full codebase and should be able to explain the architecture, flows, and implementation decisions during judging.

## Security Notes

- Firebase Admin runs server-side only
- Gemini keys stay server-side only
- route handlers validate payloads with Zod
- protected routes verify the session before mutation
- file blobs are stored in GridFS, not normal Mongo collections
- role changes are audited

## Attribution

- Next.js
- Firebase Auth
- MongoDB
- Gemini
- Leaflet
- OpenStreetMap

## License

No license file is included yet. Add one before public redistribution if your submission requires it.
