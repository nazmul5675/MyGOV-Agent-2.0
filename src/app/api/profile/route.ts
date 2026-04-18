import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { readSession } from "@/lib/auth/session";
import { upsertUserProfile } from "@/lib/repositories/users";
import { profileBasicsSchema } from "@/lib/validation/profile";

export async function PATCH(request: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = profileBasicsSchema.parse(await request.json());

    await upsertUserProfile(session.uid, {
      fullName: body.fullName,
      email: session.email,
      role: session.role,
      dateOfBirth: body.dateOfBirth,
      phoneNumber: body.phoneNumber,
      addressText: body.addressText,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid profile update." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update profile." },
      { status: 500 }
    );
  }
}
