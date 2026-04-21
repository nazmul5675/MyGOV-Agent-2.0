import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { setAdminCaseVisibility } from "@/lib/services/cases";
import { handleRouteError } from "@/lib/security/api";
import { caseVisibilitySchema } from "@/lib/validation/cases";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("admin");
    const { id } = await context.params;
    const body = caseVisibilitySchema.parse(await request.json());

    const result = await setAdminCaseVisibility({
      session,
      caseId: id,
      isHidden: body.isHidden,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, "Unable to update case visibility.");
  }
}
