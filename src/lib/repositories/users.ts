import type { AppSession, UserProfile } from "@/lib/types";
import { LiveDataError, requireDb } from "@/lib/repositories/firestore-helpers";

export async function getUserProfile(session: AppSession): Promise<UserProfile> {
  const db = requireDb();
  const snapshot = await db.collection("users").doc(session.uid).get();

  if (!snapshot.exists) {
    throw new LiveDataError(
      `No Firestore profile exists for user ${session.uid}. Create users/${session.uid} before loading the profile page.`,
      "setup"
    );
  }

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
