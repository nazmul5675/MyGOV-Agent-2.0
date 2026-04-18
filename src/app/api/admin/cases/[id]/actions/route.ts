import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { readSession } from "@/lib/auth/session";
import { applyAdminCaseAction } from "@/lib/repositories/cases";
import { adminActionSchema } from "@/lib/validation/cases";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const body = adminActionSchema.parse(await request.json());

    const result = await applyAdminCaseAction({
      caseId: id,
      action: body.action,
      note: body.note,
      actorName: session.name,
      actorId: session.uid,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid request." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update the case." },
      { status: 500 }
    );
  }
}
