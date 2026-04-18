import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { sessionCookieName } from "@/lib/constants";
import { getAdminAuth, getUserRole } from "@/lib/firebase/admin";
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
    const role = roleFromClaims || (await getUserRole(decoded.uid)) || "citizen";

    return {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "MyGOV User",
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
