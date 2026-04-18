import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { readSession } from "@/lib/auth/session";
import { buildAssistantReply } from "@/lib/assistant";
import {
  appendAssistantMessage,
  getAdminCaseById,
  getCitizenCaseById,
} from "@/lib/repositories/cases";
import { assistantMessageSchema } from "@/lib/validation/cases";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = assistantMessageSchema.parse(await request.json());
    const caseItem = body.caseId
      ? session.role === "admin"
        ? await getAdminCaseById(body.caseId)
        : await getCitizenCaseById(session.uid, body.caseId)
      : null;

    if (body.caseId && !caseItem) {
      return NextResponse.json({ error: "Case context could not be loaded." }, { status: 404 });
    }

    const userMessage = await appendAssistantMessage({
      userId: session.uid,
      role: "user",
      body: body.body,
      caseId: body.caseId,
    });

    const reply = buildAssistantReply({
      prompt: body.body,
      caseItem,
      citizenName: session.name,
    });

    const assistantMessage = await appendAssistantMessage({
      userId: session.uid,
      role: "assistant",
      body: reply,
      caseId: body.caseId,
      attachments:
        caseItem?.intake.missingDocuments.length
          ? caseItem.intake.missingDocuments.slice(0, 3)
          : [],
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid message." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send message." },
      { status: 500 }
    );
  }
}
