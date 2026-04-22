# MyGOV Agent 2.0

MyGOV Agent 2.0 is a GovTech case-management app built in a single Next.js App Router repo. It runs in one live mode only: Firebase Auth for identity, MongoDB for application data, MongoDB GridFS for uploaded files, and Gemini for server-side AI assistance.

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
