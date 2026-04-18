import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { sessionCookieName } from "@/lib/constants";
import {
  getAdminAuth,
  getAuthUserRecord,
  getUserProfileRecord,
  getUserRole,
  getUserRoleFromAuth,
} from "@/lib/firebase/admin";
import type { AppSession, UserRole } from "@/lib/types";

export async function readSession() {
  const cookieStore = await cookies();
  const firebaseToken = cookieStore.get(sessionCookieName)?.value;

  if (!firebaseToken) return null;
  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(firebaseToken, true);
    const roleFromClaims =
      typeof decoded.role === "string" ? (decoded.role as UserRole) : null;
    const authUser = await getAuthUserRecord(decoded.uid);
    const profileRecord = await getUserProfileRecord(decoded.uid);
    const role =
      roleFromClaims ||
      (await getUserRoleFromAuth(decoded.uid)) ||
      (profileRecord && typeof profileRecord.role === "string"
        ? (profileRecord.role as UserRole)
        : await getUserRole(decoded.uid));

    if (!role) return null;

    return {
      uid: decoded.uid,
      email: decoded.email || String(profileRecord?.email || ""),
      name:
        (typeof profileRecord?.fullName === "string" && profileRecord.fullName) ||
        authUser?.displayName ||
        decoded.name ||
        "MyGOV User",
      role,
    } satisfies AppSession;
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireSession();
  if (session.role !== role) {
    redirect(session.role === "admin" ? "/admin" : "/dashboard");
  }
  return session;
}
