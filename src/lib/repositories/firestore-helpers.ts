import { getMissingFirebaseAdminVars } from "@/lib/firebase/config";
import { getAdminDb } from "@/lib/firebase/admin";

export class LiveDataError extends Error {
  constructor(
    message: string,
    public tone: "setup" | "error" = "error"
  ) {
    super(message);
    this.name = "LiveDataError";
  }
}

export function getDb() {
  return getAdminDb();
}

export function isFirestoreAvailable() {
  return Boolean(getDb());
}

export function requireDb() {
  const db = getDb();

  if (db) return db;

  const missing = getMissingFirebaseAdminVars();
  const details = missing.length
    ? ` Missing env vars: ${missing.join(", ")}.`
    : "";

  throw new LiveDataError(
    `Firebase Admin is not configured for live Firestore access.${details}`,
    "setup"
  );
}

export function isoNow() {
  return new Date().toISOString();
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
