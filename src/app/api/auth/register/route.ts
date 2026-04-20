import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createPrototypeSessionToken } from "@/lib/auth/prototype-session";
import { isPrototypeMode } from "@/lib/config/app-mode";
import { sessionCookieName } from "@/lib/constants";
import { getAdminAuth } from "@/lib/firebase/admin";
import { createPrototypeUser, getUserProfileByUid, upsertUserProfile } from "@/lib/repositories/users";
import { registerProfileSchema, registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    if (isPrototypeMode()) {
      const body = registerSchema.parse(await request.json());
      const user = await createPrototypeUser({
        fullName: body.fullName,
        email: body.email,
        password: body.password,
      });
      const sessionToken = await createPrototypeSessionToken({
        uid: user.uid,
        email: user.email,
        name: user.fullName,
        role: user.role,
      });
      const response = NextResponse.json({
        ok: true,
        role: user.role,
        profileCreated: true,
        warning: null,
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

    const body = registerProfileSchema.parse(await request.json());
    const adminAuth = getAdminAuth();

    if (!adminAuth) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Add the server credentials first." },
        { status: 400 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(body.idToken, true);
    const email = decoded.email;

    if (!email) {
      return NextResponse.json(
        { error: "This Firebase account is missing an email address." },
        { status: 400 }
      );
    }

    const authUser = await adminAuth.getUser(decoded.uid);
    const existingClaims =
      authUser.customClaims && typeof authUser.customClaims === "object"
        ? authUser.customClaims
        : {};
    const claimRole =
      typeof existingClaims.role === "string" ? existingClaims.role : null;

    if (claimRole !== "admin" && claimRole !== "citizen") {
      await adminAuth.setCustomUserClaims(decoded.uid, {
        ...existingClaims,
        role: "citizen",
      });
    }

    if (!authUser.displayName || authUser.displayName !== body.fullName) {
      await adminAuth.updateUser(decoded.uid, {
        displayName: body.fullName,
      });
    }

    let profileCreated = false;
    let warning: string | undefined;

    try {
      const existing = await getUserProfileByUid(decoded.uid).catch(() => null);
      await upsertUserProfile(decoded.uid, {
        fullName: body.fullName,
        email,
        role: "citizen",
        dateOfBirth: existing?.dateOfBirth,
        phoneNumber: existing?.phoneNumber,
        addressText: existing?.addressText,
      });
      profileCreated = true;
    } catch (profileError) {
      warning =
        profileError instanceof Error
          ? profileError.message
          : "MongoDB profile bootstrap was skipped.";
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, { expiresIn });
    const response = NextResponse.json({
      ok: true,
      role: "citizen",
      profileCreated,
      warning,
    });
    response.cookies.set(sessionCookieName, sessionCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: expiresIn / 1000,
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid registration request." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create account." },
      { status: 500 }
    );
  }
}
