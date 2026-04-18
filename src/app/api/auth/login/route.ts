import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAuth } from "@/lib/firebase/admin";
import { sessionCookieName } from "@/lib/constants";

const schema = z.object({
  idToken: z.string().min(10),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const adminAuth = getAdminAuth();

  if (!adminAuth) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured. Use demo login until secrets are added." },
      { status: 400 }
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

  return NextResponse.json({ ok: true });
}
