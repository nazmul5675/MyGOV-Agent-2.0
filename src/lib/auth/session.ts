import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { sessionCookieName } from "@/lib/constants";
import { getAdminAuth } from "@/lib/firebase/admin";
import { touchUserActivity } from "@/lib/repositories/users";
import { resolveAppUserByFirebaseUid } from "@/lib/services/auth";
import type { UserRole } from "@/lib/types";

export async function readSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  if (!sessionToken) return null;

  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionToken, true);
    const session = await resolveAppUserByFirebaseUid(decoded.uid);
    await touchUserActivity(decoded.uid);
    return session;
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
