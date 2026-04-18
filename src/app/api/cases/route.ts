import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { readSession } from "@/lib/auth/session";
import { createCaseRecord } from "@/lib/repositories/cases";
import { createCaseRequestSchema } from "@/lib/validation/cases";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "citizen") {
      return NextResponse.json({ error: "Only citizens can create cases." }, { status: 403 });
    }
    const body = createCaseRequestSchema.parse(await request.json());

    const created = await createCaseRecord({
      id: body.caseId,
      title: body.title,
      type: body.caseType,
      location: body.location,
      summary: body.description,
      citizenId: session.uid,
      citizenName: session.name,
      evidence: body.files,
    });

    return NextResponse.json({
      caseId: created.id,
      role: session.role,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid request." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create case." },
      { status: 500 }
    );
  }
}
