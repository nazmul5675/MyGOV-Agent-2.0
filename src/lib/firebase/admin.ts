import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { hasFirebaseAdminConfig } from "@/lib/firebase/config";

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

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}
