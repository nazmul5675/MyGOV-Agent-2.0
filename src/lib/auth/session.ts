import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isPrototypeMode } from "@/lib/config/app-mode";
import { sessionCookieName } from "@/lib/constants";
import { verifyPrototypeSessionToken } from "@/lib/auth/prototype-session";
import {
  getAdminAuth,
  getAuthUserRecord,
  getUserRoleFromAuth,
} from "@/lib/firebase/admin";
import { getUserProfileByUid } from "@/lib/repositories/users";
import type { AppSession, UserRole } from "@/lib/types";

export async function readSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;

  if (!sessionToken) return null;

  if (isPrototypeMode()) {
    try {
      return await verifyPrototypeSessionToken(sessionToken);
    } catch {
      return null;
    }
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionToken, true);
    const roleFromClaims =
      typeof decoded.role === "string" ? (decoded.role as UserRole) : null;
    const authUser = await getAuthUserRecord(decoded.uid).catch(() => null);
    const profileRecord = await getUserProfileByUid(decoded.uid).catch(() => null);
    const role =
      roleFromClaims ||
      profileRecord?.role ||
      (await getUserRoleFromAuth(decoded.uid).catch(() => null)) ||
      (profileRecord && typeof profileRecord.role === "string"
        ? (profileRecord.role as UserRole)
        : null);

    if (!role) return null;

    return {
      uid: decoded.uid,
      email:
        decoded.email ||
        authUser?.email ||
        String(profileRecord?.email || ""),
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
