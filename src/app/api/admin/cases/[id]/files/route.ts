import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { reviewAdminFile } from "@/lib/services/cases";
import { handleRouteError } from "@/lib/security/api";
import { fileReviewSchema } from "@/lib/validation/cases";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
  ) {
  try {
    const session = await requireRole("admin");
    const { id } = await context.params;
    const body = fileReviewSchema.parse(await request.json());

    await reviewAdminFile({ session, caseId: id, fileId: body.fileId, status: body.status, note: body.note });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Unable to update file review.");
  }
}
