# MyGOV Agent 2.0

MyGOV Agent 2.0 is a production-shaped GovTech case-management MVP for citizens and admins. It gives citizens one clear service entry point, keeps files and case progress visible, uses Gemini for case-aware help, and gives admins an operational review workspace instead of a decorative dashboard.

## Why This Matters

Public service journeys often break down because people do not know:

- where to start
- what documents are still missing
- what the current status actually means
- which agency is handling the case
- what to do next

MyGOV Agent 2.0 turns that into a single case workflow with:

- one citizen entry point
- guided AI assistance
- visible evidence handling
- timeline-based status clarity
- admin review operations in the same product

## Product Roles

- `citizen`
- `admin`

Citizens can create and track cases, upload evidence, view location context, ask the assistant for help, and follow next-step guidance. Admins can review the queue, inspect evidence, request more documents, add internal notes, update case status, and monitor operational activity.

## Core Experience

### Citizen command center

- welcome state with active case context
- recent cases and next best actions
- AI assistant for documents, explanations, and next steps
- uploaded files overview with review states
- reminders, notifications, and recent activity
- direct CTA to create a new case

### Citizen case workspace

- case summary and status
- file evidence workspace
- event timeline
- missing document checklist
- Leaflet location context
- AI helper tied to the case

### Admin control center

- queue overview
- review workload and urgent items
- file review surface
- AI-ready operational summaries
- user management and role control
- recent activity
- direct navigation into case review

### Admin case workspace

- citizen context
- case summary and urgency
- evidence review actions
- internal note capture
- status update actions
- timeline and map context
- AI review helper

### Admin user management

- protected `/admin/users` console
- search and filter by role, status, and account identity
- inspect profile completeness and related case counts
- promote citizen to admin or demote admin to citizen with confirmation
- audit role changes in admin activity history

## Architecture

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod
- Firebase Auth for identity, login, register, forgot-password, and session exchange
- Firebase Storage for file uploads in live mode
- MongoDB as the source of truth for application data
- Gemini for assistant responses and summaries
- Leaflet + OpenStreetMap for map and location context

## Data Architecture

MongoDB is the source of truth for application data.

Primary collections:

- `users`
- `cases`
- `case_events`
- `files`
- `notifications`
- `reminders`
- `chat_messages`
- `admin_notes`

Firebase remains responsible for:

- authentication identity
- password reset
- session bootstrap
- file upload and storage

File blobs are not stored in MongoDB. Only file metadata, review state, and workflow context are stored there.

## Repository Layer

MongoDB-backed repositories live under [`src/lib/repositories`](src/lib/repositories):

- `users.ts`
- `cases.ts`
- `files.ts`
- `notifications.ts`
- `chat.ts`
- `bootstrap.ts`

Shared MongoDB connection logic lives in [`src/lib/mongodb.ts`](src/lib/mongodb.ts).

On first run, the repository bootstrap seeds MongoDB from the structured demo dataset in `src/data/prototype` if the main collections are empty. That keeps the demo flow stable while making MongoDB the actual runtime store.

## Auth and Demo Access

The app supports two operating modes:

- `live`
- `prototype`

### Live mode

- Firebase Auth handles login, register, and forgot-password
- MongoDB stores user profile and application data
- Firebase Storage handles real uploads
- public registration always creates `citizen` accounts
- admins sign in through the shared login with assigned credentials
- citizen users land on `/dashboard`
- admin users land on `/admin`

### Demo mode

- stable seeded demo credentials are available for judges
- session cookies are still server-validated
- MongoDB still stores the application data
- uploads use the demo upload path for presentation stability

Default env examples are set to `prototype` so the judge-friendly seeded demo flow works out of the box. Switch to `live` when you want Firebase-backed sign-in and uploads.

## Demo Credentials

Demo credentials are shown directly in the login UI when `NEXT_PUBLIC_APP_MODE=prototype`.

Primary demo flow:

- Citizen: `aisyah.rahman@mygov-demo.my` / `DemoCitizen123`
- Admin: `amir.fauzi@mygov-demo.my` / `DemoAdmin123`

## AI Integration

Gemini integration lives in:

- [`src/lib/ai/gemini.ts`](src/lib/ai/gemini.ts)

Assistant fallback logic lives in:

- [`src/lib/assistant.ts`](src/lib/assistant.ts)

The assistant is case-aware and file-aware. It is used for:

- document guidance
- missing document suggestions
- citizen-friendly summaries
- admin summaries
- next-step explanation
- issue clarification

If `GEMINI_API_KEY` is unavailable, the app falls back to a built-in workflow guide so the product still demos reliably.

## Leaflet Location Flow

Leaflet/OpenStreetMap components live in:

- [`src/components/maps/location-picker-card.tsx`](src/components/maps/location-picker-card.tsx)
- [`src/components/maps/location-preview-card.tsx`](src/components/maps/location-preview-card.tsx)
- [`src/components/maps/leaflet-preview-map.tsx`](src/components/maps/leaflet-preview-map.tsx)
- [`src/lib/maps/leaflet.ts`](src/lib/maps/leaflet.ts)

Location UX supports:

- case creation location selection
- citizen case location preview
- admin review map context
- address, coordinates, and supporting location details

## Route Map

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

## Judge Demo Flow

Recommended hero flow:

1. Sign in as the citizen demo account.
2. Open `/dashboard`.
3. Show active case context, reminders, next actions, files, and the AI assistant.
4. Ask the assistant what documents are still needed.
5. Open the flood-relief case.
6. Show the timeline, evidence states, location map, and next-step guidance.
7. Switch to the admin demo account.
8. Open `/admin`.
9. Show queue visibility, file review workload, and AI summary cards.
10. Open the same case in `/admin/cases/[id]`.
11. Review evidence, add an internal note, request more documents or update status.
12. Open `/admin/users` and show safe role control and user oversight.
13. Return to the citizen side and show that the workflow context is coherent.

Secondary “No Wrong Door” proof:

- public complaint flows such as pothole or streetlamp issues are also supported through the same case model.

## Environment Variables

Copy `.env.local.example` to `.env.local`.

Required core variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_MODE`
- `APP_SESSION_SECRET`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Firebase client variables for live auth and uploads:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Firebase admin variables for secure session exchange:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `SESSION_COOKIE_NAME`

### Example

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_MODE=live
APP_SESSION_SECRET=replace-with-a-long-random-string
MONGODB_URI=replace-with-your-mongodb-uri
MONGODB_DB_NAME=mygov_agent_2
GEMINI_API_KEY=replace-with-your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash-lite
SESSION_COOKIE_NAME=mygov_session
```

## Local Setup

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
```

## Validation

Run after each milestone:

```bash
npm run lint
npm run typecheck
npm run build
```

## AI Usage Disclosure

- Gemini powers assistant responses when configured.
- The fallback assistant uses local workflow guidance when Gemini is unavailable.
- Seed demo data is used only to bootstrap MongoDB for presentation stability.
- The product does not claim fully automated policy adjudication or document forensics.

## Repo Hygiene

Do not include these in handoff packages:

- `.env`
- `.env.local`
- `.git`
- `.next`
- `node_modules`
- cache folders
- build artifacts

## Submission Positioning

This repo is intended to feel deployable next, not just presentable:

- real auth path
- Mongo-backed application data
- Firebase-backed identity and file storage
- Gemini-centered assistance
- Leaflet-powered location context
- polished citizen and admin workflows
