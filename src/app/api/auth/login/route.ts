import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminAuth, getUserRole } from "@/lib/firebase/admin";
import { sessionCookieName } from "@/lib/constants";
import { sessionExchangeSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const body = sessionExchangeSchema.parse(await request.json());
  const adminAuth = getAdminAuth();

  if (!adminAuth) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured. Add the server credentials first." },
      { status: 400 }
    );
  }

  const decoded = await adminAuth.verifyIdToken(body.idToken, true);
  const roleFromClaims =
    typeof decoded.role === "string" ? decoded.role : null;
  const role = roleFromClaims || (await getUserRole(decoded.uid));

  if (role !== "citizen" && role !== "admin") {
    return NextResponse.json(
      {
        error:
          "This account does not have an allowed application role. Add a role custom claim or set users/{uid}.role to citizen or admin.",
      },
      { status: 403 }
    );
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(body.idToken, { expiresIn });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: expiresIn / 1000,
  });

  return NextResponse.json({ ok: true, role });
}
