import { NextResponse } from "next/server";

import { generateGeminiAssistantReply, hasGeminiKey } from "@/lib/ai/gemini";
import { readSession } from "@/lib/auth/session";
import { getAssistantHistory, appendAssistantConversation } from "@/lib/services/cases";
import { AppError, handleRouteError, unauthorized } from "@/lib/security/api";
import { assistantMessageSchema } from "@/lib/validation/cases";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();

    const body = assistantMessageSchema.parse(await request.json());
    const { caseItem, history } = await getAssistantHistory({ session, caseId: body.caseId });

    if (!hasGeminiKey()) {
      throw new AppError(
        "AI assistant is temporarily unavailable because the Gemini server configuration is missing.",
        503
      );
    }

    let geminiResult;
    try {
      geminiResult = await generateGeminiAssistantReply({
        prompt: body.body,
        role: session.role,
        citizenName: session.name,
        caseItem,
        history,
      });
    } catch (error) {
      throw new AppError(
        error instanceof Error
          ? `AI assistant is temporarily unavailable. ${error.message}`
          : "AI assistant is temporarily unavailable.",
        503
      );
    }

    const assistantBody = geminiResult.body;
    const attachments = geminiResult.attachments.length
      ? geminiResult.attachments
      : caseItem?.intake.missingDocuments.slice(0, 4) || [];
    const assistantMeta = {
      source: geminiResult.source,
      model: geminiResult.model,
    };

    const { userMessage, assistantMessage } = await appendAssistantConversation({
      session,
      body: body.body,
      caseId: body.caseId,
      assistantBody,
      attachments,
      model: assistantMeta.model,
      source: assistantMeta.source,
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
      assistantMeta,
    });
  } catch (error) {
    return handleRouteError(error, "Unable to send message.");
  }
}
