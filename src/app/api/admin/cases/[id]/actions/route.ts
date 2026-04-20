import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import { assertRole } from "@/lib/services/auth";
import { runAdminCaseAction } from "@/lib/services/cases";
import { handleRouteError, unauthorized } from "@/lib/security/api";
import { adminActionSchema } from "@/lib/validation/cases";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
  ) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();
    assertRole(session, "admin");
    const { id } = await context.params;
    const body = adminActionSchema.parse(await request.json());

    const result = await runAdminCaseAction({ session, caseId: id, action: body.action, note: body.note });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, "Unable to update the case.");
  }
}
