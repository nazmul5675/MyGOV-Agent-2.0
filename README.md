# MyGOV Agent 2.0

MyGOV Agent 2.0 is a GovTech case-management MVP built in a single Next.js App Router repo. The frontend routes stay intact while the backend now runs through Next route handlers, MongoDB repositories/services, MongoDB GridFS for uploaded files, Firebase Auth for identity, and Gemini for server-side AI help.

Hero flow:

`citizen login -> dashboard -> upload evidence -> create/open case -> AI help -> admin review -> status update -> citizen sees live change`

## 🚀 Live Demo

**Live Hosting Link:** https://mygov-agent-2-0-526785154511.asia-southeast1.run.app/

### 🔑 Test Credentials

Use the following credentials to explore both sides of the platform:

**Citizen Portal** (File reports, upload evidence, chat with AI assistant)
- **Email:** `nazmulhasandh@gmail.com`
- **Password:** `nazmulhasandh@gmail.com1`

**Admin Console** (Review evidence, manage files, post review notes)
- **Email:** `first.admin@mygov.local`
- **Password:** `Admin12345!`

## 💻 Tech Stack

- **Framework:** [Next.js App Router](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Authentication:** [Firebase Auth](https://firebase.google.com/) (Client auth & Server-side verification via Admin SDK)
- **Database:** [MongoDB](https://www.mongodb.com/) (Application data, Users, Case Timelines, Prompts)
- **File Storage:** [MongoDB GridFS](https://www.mongodb.com/docs/manual/core/gridfs/) (Secure evidence storage)
- **Artificial Intelligence:** [Google Gemini](https://deepmind.google/technologies/gemini/) (Server-side case assistant, issue summaries)
- **Maps:** [Leaflet](https://leafletjs.com/) & OpenStreetMap (Frontend coordinate mapping)
- **Validation:** [Zod](https://zod.dev/)

## Final Backend Architecture

- `src/app/api/*`: thin route handlers
- `src/lib/auth/*`: session and identity helpers
- `src/lib/config/*`: app/env config
- `src/lib/security/*`: errors and authorization helpers
- `src/lib/repositories/*`: MongoDB data access
- `src/lib/services/*`: business logic
- `src/lib/storage/gridfs.ts`: GridFS upload/delete/download helpers
- `src/lib/ai/*`: Gemini prompts and model calls
- `src/lib/audit/*`: audit helpers
- `src/lib/validation/*`: Zod schemas
- `src/types/*`: typed document models

## Identity And Data Boundaries

- Firebase Auth: client sign-in, registration, password reset, auth state
- Firebase Admin: verify ID tokens, create/verify session cookies, read Firebase UID
- MongoDB: users, cases, case events, file metadata, notifications, reminders, chat, admin notes, role audit logs
- MongoDB GridFS: uploaded evidence blobs
- Gemini: server-side AI only
- Leaflet: frontend-only map UI

There is no separate Express backend, no Firestore dependency, and no Firebase Storage dependency in the runtime upload flow.

## Role Model

Supported roles:

- `citizen`
- `admin`

Rules:

- public registration always creates `citizen`
- admin cannot self-register publicly
- citizen routes resolve to `/dashboard`
- admin routes resolve to `/admin`
- role is resolved from MongoDB user records, not from client-selected state
- role changes are admin-only and written to `role_audit_logs`
- self-demotion and last-admin removal are blocked

## MongoDB Collections

- `users`
- `cases`
- `case_events`
- `files_metadata`
- `notifications`
- `reminders`
- `chat_messages`
- `admin_notes`
- `role_audit_logs`

GridFS bucket collections:

- `<GRIDFS_BUCKET_NAME>.files`
- `<GRIDFS_BUCKET_NAME>.chunks`

## File Storage Model

- file blobs are stored in MongoDB GridFS
- file metadata is stored in `files_metadata`
- each file metadata record links the case, owner, review state, and GridFS blob id
- file preview/download is served through `GET /api/files/[id]`

Metadata fields include:

- `id`
- `fileId`
- `gridFsFileId`
- `caseId`
- `ownerUid`
- `filename`
- `mimeType`
- `size`
- `category`
- `uploadedAt`
- `reviewStatus`
- `reviewNote`
- `uploadedByRole`

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

- live uploads flow through `POST /api/uploads`
- blobs are stored in GridFS
- metadata is stored in MongoDB
- file streaming uses `GET /api/files/[id]`
- admin review updates write review status and notes back to MongoDB

### Admin Operations

- admin user list/search/filter
- user detail reads
- citizen/admin role changes
- dedicated role audit logging

### AI Layer

- Gemini runs server-side only
- case-aware prompts include summaries, status, files, and missing docs
- graceful fallback remains available for demo stability

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

## Hero Demo Flow

1. Citizen signs in with Firebase Auth.
2. `/dashboard` loads MongoDB-backed cases and reminders.
3. Citizen opens `/cases/new`.
4. Evidence uploads through the Next backend into GridFS.
5. Case creation stores metadata in MongoDB and writes timeline events.
6. Citizen opens `/cases/[id]` and sees uploads, timeline, and AI help.
7. Admin opens `/admin` and `/admin/cases/[id]`.
8. Admin reviews files, updates status, or requests more documents.
9. Citizen sees updated status, file review notes, and timeline changes.

## Environment Variables

Use `.env.local` for local development. Never commit real values.

Required app vars:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_MODE`
- `APP_SESSION_SECRET`
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

## Demo Mode vs Live Mode

- `prototype`: seeded MongoDB data plus stable demo auth/upload behavior
- `live`: Firebase Auth + Firebase Admin verification + MongoDB + GridFS + Gemini

## Security Notes

- Firebase Admin runs server-side only
- Gemini keys stay server-side only
- route handlers validate payloads with Zod
- protected routes verify the session before mutation
- file blobs are stored in GridFS, not in normal Mongo collections
- role changes are audited

## AI-Assisted Development Disclosure

This repository includes AI-assisted implementation work. AI tooling was used to help generate, refactor, and document parts of the codebase. Final integration, project-specific adaptation, and validation were performed inside the repo workflow.

## Attribution

- Next.js
- Firebase Auth
- MongoDB
- Gemini
- Leaflet
- OpenStreetMap

## License

No license file is included yet. Add one before public redistribution if your submission requires it.
