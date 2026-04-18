import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type JWTPayload, SignJWT, jwtVerify } from "jose";

import { demoCookieName, sessionCookieName } from "@/lib/constants";
import { demoUsers } from "@/lib/demo-data";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { AppSession, UserRole } from "@/lib/types";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-mygov-agent-secret"
);

type DemoJwtPayload = JWTPayload & AppSession & {
  iat?: number;
  exp?: number;
};

export async function createDemoSessionToken(session: AppSession) {
  return new SignJWT({ ...(session as DemoJwtPayload) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyDemoSessionToken(token: string) {
  const verified = await jwtVerify<DemoJwtPayload>(token, secret);
  return verified.payload;
}

export async function readSession() {
  const cookieStore = await cookies();
  const demoToken = cookieStore.get(demoCookieName)?.value;
  const firebaseToken = cookieStore.get(sessionCookieName)?.value;

  if (demoToken) {
    try {
      const payload = await verifyDemoSessionToken(demoToken);
      return {
        uid: payload.uid,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      } satisfies AppSession;
    } catch {
      return null;
    }
  }

  if (!firebaseToken) return null;
  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(firebaseToken, true);
    const adminDb = getAdminDb();
    const userDoc = adminDb
      ? await adminDb.collection("users").doc(decoded.uid).get()
      : null;
    const role = (userDoc?.data()?.role as UserRole | undefined) || "citizen";
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      name: userDoc?.data()?.name || decoded.name || "MyGOV User",
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

export function getDemoSession(role: UserRole) {
  return role === "admin" ? demoUsers["admin-001"] : demoUsers["citizen-001"];
}
