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
    email: String(data.email || session.email),
    fullName: String(data.fullName || session.name || "MyGOV User"),
    role: session.role,
    dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth) : undefined,
    phoneNumber: data.phoneNumber ? String(data.phoneNumber) : undefined,
    addressText: data.addressText ? String(data.addressText) : undefined,
    documents: Array.isArray(data.documents)
      ? data.documents.map((item) => String(item))
      : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  };
}

export async function upsertUserProfile(
  uid: string,
  data: {
    fullName: string;
    email: string;
    role?: "citizen" | "admin";
    dateOfBirth?: string;
    phoneNumber?: string;
    addressText?: string;
  }
) {
  const db = requireDb();
  const now = new Date().toISOString();
  const docRef = db.collection("users").doc(uid);
  const snapshot = await docRef.get();

  await docRef.set(
    {
      uid,
      fullName: data.fullName,
      email: data.email,
      role: snapshot.exists ? snapshot.data()?.role || data.role || "citizen" : data.role || "citizen",
      dateOfBirth: data.dateOfBirth || null,
      phoneNumber: data.phoneNumber || null,
      addressText: data.addressText || null,
      updatedAt: now,
      createdAt: snapshot.exists ? snapshot.data()?.createdAt || now : now,
    },
    { merge: true }
  );
}
