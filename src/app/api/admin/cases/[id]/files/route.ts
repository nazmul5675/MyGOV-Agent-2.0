import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth/session";
import { updateEvidenceReviewStatus } from "@/lib/repositories/cases";
import { fileReviewSchema } from "@/lib/validation/cases";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("admin");
    const { id } = await context.params;
    const body = fileReviewSchema.parse(await request.json());

    await updateEvidenceReviewStatus({
      caseId: id,
      fileId: body.fileId,
      status: body.status,
      note: body.note,
      actorName: session.name,
      actorId: session.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid file review update." },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update file review." },
      { status: 500 }
    );
  }
}
