import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import { assertRole } from "@/lib/services/auth";
import { attachCitizenEvidence } from "@/lib/services/cases";
import { handleRouteError, unauthorized } from "@/lib/security/api";
import { evidenceMetadataSchema } from "@/lib/validation/cases";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
  ) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();
    assertRole(session, "citizen");
    const { id } = await context.params;
    const body = evidenceMetadataSchema.parse(await request.json());

    await attachCitizenEvidence({ session, caseId: id, files: body.files });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Unable to attach evidence.");
  }
}
