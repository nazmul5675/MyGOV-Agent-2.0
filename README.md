# MyGOV Agent 2.0

Premium GovTech web application scaffold for citizen case intake, tracking, and protected admin review. The product direction follows a Citizens First model: one trusted entry point for multimodal case submission, structured intake, unified tracking, and role-aware back-office decision support.

## Problem Statement

Government digital experiences often fragment citizen requests across departments, channels, and follow-up loops. MyGOV Agent 2.0 provides a calmer, more trustworthy workflow:

- Citizens submit a case through text, photo, document, or voice note.
- The system structures intake into a clean case packet.
- Citizens track status, reminders, and evidence in one place.
- Admins review, route, request documents, and resolve cases from a protected workspace.

## User Roles

- `citizen`
- `admin`

Admin includes officer-style review capabilities. All internal review pages live under `/admin`.

## Key Features

- Next.js App Router architecture with server-first route protection
- Premium landing page and reusable design system inspired by the provided starter ZIP
- Firebase Authentication scaffold with secure session-cookie route handlers
- Demo login mode for judges when Firebase secrets are not configured yet
- Citizen dashboard, case intake, upload progress UI, and case detail tracking
- Admin queue, case review surface, evidence previews, notes, and status actions
- AI-ready intake scaffold with citizen summary, admin summary, urgency, missing docs, and structured JSON
- Firestore and Storage rules starter files for RBAC-minded security setup

## Stack

- Next.js 16
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

## Architecture Summary

- `src/app/(marketing)`:
  Public landing experience
- `src/app/(auth)`:
  Login flow
- `src/app/(app)`:
  Protected citizen and admin product routes
- `src/app/api/auth/*`:
  Session creation and logout handlers
- `src/components/*`:
  Reusable UI system and role-aware shells
- `src/lib/*`:
  Auth, Firebase, demo data, and shared types

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment values:

```bash
cp .env.local.example .env.local
```

3. Add Firebase web config and Firebase Admin secrets.

4. Run the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Environment Variables

See `.env.example` and `.env.local.example`.

Required groups:

- Next public Firebase config
- Firebase Admin service account config
- `SESSION_SECRET`
- cookie naming
- app URL

## Firebase Setup Notes

- Enable Email/Password in Firebase Authentication.
- Create `users/{uid}` documents in Firestore with at least:

```json
{
  "name": "Farid Hakim",
  "role": "admin"
}
```

- Apply `firestore.rules` and `storage.rules` after adapting them to your project.
- `src/app/api/auth/login/route.ts` exchanges an ID token for a secure session cookie.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Folder Structure

```text
src/
  app/
    (marketing)/
    (auth)/
    (app)/
    api/auth/
  components/
    common/
    forms/
    layout/
    providers/
    ui/
  lib/
    auth/
    firebase/
```

## Demo Credentials

Demo mode is available from `/login` without Firebase setup.

- Citizen placeholder: `citizen@demo.mygov.my`
- Admin placeholder: `admin@demo.mygov.my`
- Password placeholder: `Demo123!`

## AI Usage Disclosure

This MVP does not yet call Gemini directly. It prepares the product for later AI integration by generating structured intake fields, missing-document scaffolds, citizen summary content, and admin summary content in a clean extension point.

## Roadmap

- Firestore-backed mutations for case create/review actions
- Real Firebase Storage uploads with resumable progress and metadata persistence
- Google sign-in
- Notification center backed by Firestore and FCM
- Gemini intake summarization and document gap detection
- Admin user management and settings pages

## Deployment Notes

- Vercel is a practical deployment target for the frontend.
- Add Firebase Admin secrets in project environment settings.
- Set `NEXT_PUBLIC_APP_URL` to the deployed origin.
- Use HTTPS in production so secure cookies work correctly.
