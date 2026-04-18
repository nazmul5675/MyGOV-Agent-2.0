import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDemoSessionToken, getDemoSession } from "@/lib/auth/session";
import { demoCookieName } from "@/lib/constants";

const schema = z.object({
  role: z.enum(["citizen", "admin"]),
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const session = getDemoSession(body.role);
  const token = await createDemoSessionToken({
    ...session,
    email: body.email,
  });

  const cookieStore = await cookies();
  cookieStore.set(demoCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
