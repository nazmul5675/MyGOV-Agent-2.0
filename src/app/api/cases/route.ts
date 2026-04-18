import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import { createCaseRecord } from "@/lib/repositories/cases";
import { createCaseSchema } from "@/lib/validation/cases";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "citizen") {
    return NextResponse.json({ error: "Only citizens can create cases." }, { status: 403 });
  }
  const body = createCaseSchema.parse(await request.json());

  const created = await createCaseRecord({
    title: body.title,
    type: body.caseType,
    location: body.location,
    summary: body.description,
    citizenId: session.uid,
    citizenName: session.name,
  });

  return NextResponse.json({
    caseId: created.id,
    role: session.role,
  });
}
