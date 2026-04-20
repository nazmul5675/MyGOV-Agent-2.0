import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth/session";
import { updateUserRole } from "@/lib/repositories/users";
import { adminRoleUpdateSchema } from "@/lib/validation/auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("admin");
    const { id } = await context.params;
    const body = adminRoleUpdateSchema.parse(await request.json());

    const result = await updateUserRole({
      targetUid: id,
      nextRole: body.role,
      actorId: session.uid,
      actorName: session.name,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid role update request." },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update the user role." },
      { status: 500 }
    );
  }
}
