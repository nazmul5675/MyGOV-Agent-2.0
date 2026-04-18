import { getAdminDb } from "@/lib/firebase/admin";

export function getDb() {
  return getAdminDb();
}

export function isFirestoreAvailable() {
  return Boolean(getDb());
}

export function isoNow() {
  return new Date().toISOString();
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
