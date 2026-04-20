import { NextResponse } from "next/server";

import { generateGeminiAssistantReply, hasGeminiKey } from "@/lib/ai/gemini";
import { readSession } from "@/lib/auth/session";
import { buildAssistantFallbackNotice, buildAssistantReply } from "@/lib/assistant";
import { getAssistantHistory, appendAssistantConversation } from "@/lib/services/cases";
import { handleRouteError, unauthorized } from "@/lib/security/api";
import { assistantMessageSchema } from "@/lib/validation/cases";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();

    const body = assistantMessageSchema.parse(await request.json());
    const { caseItem, history } = await getAssistantHistory({ session, caseId: body.caseId });

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
