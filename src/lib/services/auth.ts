import "server-only";

import { getAdminAuth, getAuthUserRecord, getUserRoleFromAuth } from "@/lib/firebase/admin";
import { getUserProfileByUid, touchUserActivity, upsertUserProfile } from "@/lib/repositories/users";
import { forbidden, unauthorized } from "@/lib/security/api";
import type { AppSession, UserRole } from "@/lib/types";

export async function resolveAppUserByFirebaseUid(uid: string) {
  const [profile, authUser, roleFromClaims] = await Promise.all([
    getUserProfileByUid(uid).catch(() => null),
    getAuthUserRecord(uid).catch(() => null),
    getUserRoleFromAuth(uid).catch(() => null),
  ]);

  const role = profile?.role || roleFromClaims;
  if (role !== "citizen" && role !== "admin") {
    throw forbidden(
      "This account does not have an allowed application role. It must be citizen or admin."
    );
  }

  const email = profile?.email || authUser?.email;
  if (!email) {
    throw unauthorized("This authenticated account is missing an email address.");
  }

  const fullName = profile?.fullName || authUser?.displayName || "MyGOV User";

  await upsertUserProfile(uid, {
    fullName,
    email,
    role,
    dateOfBirth: profile?.dateOfBirth,
    phoneNumber: profile?.phoneNumber,
    addressText: profile?.addressText,
  });
  await touchUserActivity(uid);

  return {
    uid,
    email,
    name: fullName,
    role,
  } satisfies AppSession;
}

export async function verifyFirebaseIdToken(idToken: string) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    throw unauthorized("Firebase Admin is not configured. Add the server credentials first.");
  }

  const decoded = await adminAuth.verifyIdToken(idToken, true);
  return resolveAppUserByFirebaseUid(decoded.uid);
}

export async function createFirebaseSessionCookie(idToken: string) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    throw unauthorized("Firebase Admin is not configured. Add the server credentials first.");
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  return { sessionCookie, maxAgeSeconds: expiresIn / 1000 };
}

export function assertRole(session: AppSession, role: UserRole) {
  if (session.role !== role) {
    throw forbidden(role === "admin" ? "Admin access is required." : "Citizen access is required.");
  }
}
