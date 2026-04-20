import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generateGeminiAssistantReply, hasGeminiKey } from "@/lib/ai/gemini";
import { readSession } from "@/lib/auth/session";
import { buildAssistantFallbackNotice, buildAssistantReply } from "@/lib/assistant";
import {
  appendAssistantMessage,
  getAdminCaseById,
  getCitizenCaseById,
  listCaseAssistantMessages,
  listDashboardAssistantMessages,
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

    const history = body.caseId
      ? await listCaseAssistantMessages(body.caseId)
      : await listDashboardAssistantMessages(session.uid);

    const geminiConfigured = hasGeminiKey();
    let assistantBody: string;
    let attachments: string[] = [];
    let assistantMeta;

    try {
      if (geminiConfigured) {
        const geminiResult = await generateGeminiAssistantReply({
            prompt: body.body,
            role: session.role,
            citizenName: session.name,
            caseItem,
            history,
          });

        assistantBody = geminiResult.body;
        attachments = geminiResult.attachments.length
          ? geminiResult.attachments
          : caseItem?.intake.missingDocuments.slice(0, 4) || [];
        assistantMeta = {
          source: geminiResult.source,
          model: geminiResult.model,
        };
      } else {
        const fallback = buildAssistantReply({
          prompt: body.body,
          caseItem,
          citizenName: session.name,
          role: session.role,
        });

        assistantBody = fallback.reply;
        attachments = fallback.attachments;
        assistantMeta = buildAssistantFallbackNotice({
          hadGeminiKey: false,
        });
      }
    } catch (failure) {
      const fallback = buildAssistantReply({
        prompt: body.body,
        caseItem,
        citizenName: session.name,
        role: session.role,
      });

      assistantBody = fallback.reply;
      attachments = fallback.attachments;
      assistantMeta = buildAssistantFallbackNotice({
        hadGeminiKey: geminiConfigured,
        failure,
      });
    }

    const assistantMessage = await appendAssistantMessage({
      userId: session.uid,
      role: "assistant",
      body: assistantBody,
      caseId: body.caseId,
      attachments,
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
      assistantMeta,
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
