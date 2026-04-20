import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import { upsertUserProfile } from "@/lib/repositories/users";
import { handleRouteError, unauthorized } from "@/lib/security/api";
import { profileBasicsSchema } from "@/lib/validation/profile";

export async function PATCH(request: Request) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();

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
    return handleRouteError(error, "Unable to update profile.");
  }
}
