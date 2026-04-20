import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { changeUserRole } from "@/lib/services/users";
import { handleRouteError } from "@/lib/security/api";
import { adminRoleUpdateSchema } from "@/lib/validation/auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("admin");
    const { id } = await context.params;
    const body = adminRoleUpdateSchema.parse(await request.json());

    const result = await changeUserRole({ session, targetUid: id, nextRole: body.role });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, "Unable to update the user role.");
  }
}
