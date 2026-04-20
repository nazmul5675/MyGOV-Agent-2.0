import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { hasFirebaseAdminConfig } from "@/lib/firebase/config";
import { normalizeUserRole } from "@/lib/firebase/roles";
import type { UserRole } from "@/lib/types";

let adminApp: App | null = null;

export function getFirebaseAdminApp() {
  if (!hasFirebaseAdminConfig()) return null;
  if (adminApp) return adminApp;

  adminApp =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

  return adminApp;
}

export function getAdminAuth() {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
}

export async function getUserRoleFromAuth(uid: string): Promise<UserRole | null> {
  const auth = getAdminAuth();
  if (!auth) return null;

  const user = await auth.getUser(uid);
  return normalizeUserRole(user.customClaims?.role);
}

export async function getAuthUserRecord(uid: string) {
  const auth = getAdminAuth();
  if (!auth) return null;

  return auth.getUser(uid);
}
