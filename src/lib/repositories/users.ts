import { demoUsers } from "@/lib/demo-data";
import type { AppSession, UserProfile } from "@/lib/types";
import { getDb, isoNow, isFirestoreAvailable } from "@/lib/repositories/firestore-helpers";

function fallbackProfile(session: AppSession): UserProfile {
  const fallback = demoUsers[session.role === "admin" ? "admin-001" : "citizen-001"];

  return {
    id: fallback.uid,
    uid: session.uid,
    email: session.email || fallback.email,
    name: session.name || fallback.name,
    role: session.role,
    phone: "+60 12-300 8891",
    location: "Petaling Jaya, Selangor",
    documents: ["MyKad", "Proof of address"],
    createdAt: isoNow(),
    updatedAt: isoNow(),
  };
}

export async function getUserProfile(session: AppSession): Promise<UserProfile> {
  if (!isFirestoreAvailable()) return fallbackProfile(session);

  const db = getDb();
  if (!db) return fallbackProfile(session);

  const snapshot = await db.collection("users").doc(session.uid).get();
  if (!snapshot.exists) return fallbackProfile(session);

  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    uid: session.uid,
    email: session.email,
    name: String(data.name || session.name || "MyGOV User"),
    role: session.role,
    phone: data.phone ? String(data.phone) : undefined,
    location: data.location ? String(data.location) : undefined,
    documents: Array.isArray(data.documents)
      ? data.documents.map((item) => String(item))
      : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  };
}
