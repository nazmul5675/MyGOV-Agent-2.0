import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/security/api";
import { createFirebaseSessionCookie, verifyFirebaseIdToken } from "@/lib/services/auth";
import { sessionCookieName } from "@/lib/constants";
import { sessionExchangeSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = sessionExchangeSchema.parse(await request.json());
    const session = await verifyFirebaseIdToken(body.idToken);
    const { sessionCookie, maxAgeSeconds } = await createFirebaseSessionCookie(body.idToken);
    const response = NextResponse.json({
      ok: true,
      role: session.role,
      redirectTo: session.role === "admin" ? "/admin" : "/dashboard",
    });
    response.cookies.set(sessionCookieName, sessionCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (error) {
    return handleRouteError(error, "Unable to sign in right now.");
  }
}
