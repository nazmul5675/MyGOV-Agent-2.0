import { NextResponse } from "next/server";

import { createPrototypeSessionToken } from "@/lib/auth/prototype-session";
import { isPrototypeMode } from "@/lib/config/app-mode";
import { getAdminAuth, getUserRoleFromAuth } from "@/lib/firebase/admin";
import {
  getUserByEmail,
  getUserProfileByUid,
  touchUserActivity,
  upsertUserProfile,
} from "@/lib/repositories/users";
import { sessionCookieName } from "@/lib/constants";
import { loginSchema, sessionExchangeSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
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
      uid: user.uid,
      email: user.email,
      name: user.fullName,
      role: user.role,
    });
    await touchUserActivity(user.uid);

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
  const profile = await getUserProfileByUid(decoded.uid).catch(() => null);
  const role =
    profile?.role ||
    roleFromClaims ||
    (await getUserRoleFromAuth(decoded.uid));

  if (role !== "citizen" && role !== "admin") {
    return NextResponse.json(
      {
        error:
          "This account does not have an allowed application role. Add a role custom claim or set users/{uid}.role to citizen or admin.",
      },
      { status: 403 }
    );
  }

  await upsertUserProfile(decoded.uid, {
    fullName: profile?.fullName || decoded.name || "MyGOV User",
    email: decoded.email || profile?.email || "",
    role,
    dateOfBirth: profile?.dateOfBirth,
    phoneNumber: profile?.phoneNumber,
    addressText: profile?.addressText,
  });
  await touchUserActivity(decoded.uid);

  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(body.idToken, { expiresIn });
  const response = NextResponse.json({
    ok: true,
    role,
    redirectTo: role === "admin" ? "/admin" : "/dashboard",
  });
  response.cookies.set(sessionCookieName, sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: expiresIn / 1000,
  });

  return response;
}
