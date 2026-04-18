import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { sessionCookieName } from "@/lib/constants";
import { getAdminAuth } from "@/lib/firebase/admin";
import { upsertUserProfile } from "@/lib/repositories/users";
import { registerProfileSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
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

    await upsertUserProfile(decoded.uid, {
      fullName: body.fullName,
      email,
      role: "citizen",
    });

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

    return NextResponse.json({ ok: true, role: "citizen" });
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
