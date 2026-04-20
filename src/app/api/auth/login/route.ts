import { NextResponse } from "next/server";

import { createPrototypeSessionToken } from "@/lib/auth/prototype-session";
import { isPrototypeMode } from "@/lib/config/app-mode";
import {
  getUserByEmail,
  touchUserActivity,
} from "@/lib/repositories/users";
import { handleRouteError } from "@/lib/security/api";
import { createFirebaseSessionCookie, verifyFirebaseIdToken } from "@/lib/services/auth";
import { sessionCookieName } from "@/lib/constants";
import { loginSchema, sessionExchangeSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    if (isPrototypeMode()) {
      const body = loginSchema.parse(await request.json());
      const user = await getUserByEmail(body.email);

      if (!user || user.password !== body.password) {
        return NextResponse.json(
          { error: "Incorrect email or password for the demo account." },
          { status: 401 }
        );
      }

      const sessionToken = await createPrototypeSessionToken({
        uid: user.firebaseUid,
        email: user.email,
        name: user.fullName,
        role: user.role,
      });
      await touchUserActivity(user.firebaseUid);

      const response = NextResponse.json({
        ok: true,
        role: user.role,
        redirectTo: user.role === "admin" ? "/admin" : "/dashboard",
      });
      response.cookies.set(sessionCookieName, sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 5,
      });

      return response;
    }

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
