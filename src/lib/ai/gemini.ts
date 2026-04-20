import "server-only";

import type { AssistantMessage, CaseItem, EvidenceFile, UserRole } from "@/lib/types";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

interface GeminiAssistantPayload {
  reply: string;
  documentChecklist: string[];
  nextSteps: string[];
  summaryTitle: string;
}

function buildCaseContext(caseItem?: CaseItem | null) {
  if (!caseItem) {
    return "No specific case is open. Focus on dashboard-level guidance, document readiness, next steps, and concise citizen-safe explanations.";
  }

  const fileSummary = caseItem.evidence.length
    ? caseItem.evidence
        .map(
          (file: EvidenceFile) =>
            `${file.name} (${file.kind}, ${file.status}${file.category ? `, ${file.category}` : ""})`
        )
        .join("; ")
    : "No files uploaded yet.";

  return [
    `Case title: ${caseItem.title}`,
    `Case type: ${caseItem.type}`,
    `Case status: ${caseItem.status}`,
    `Location: ${caseItem.location}`,
    `Citizen summary: ${caseItem.intake.citizenSummary}`,
    `Admin summary: ${caseItem.intake.adminSummary}`,
    `Category: ${caseItem.intake.category}`,
    `Urgency: ${caseItem.intake.urgency}`,
    `Missing documents: ${caseItem.intake.missingDocuments.join(", ") || "None flagged"}`,
    `Files: ${fileSummary}`,
    `Latest internal note: ${caseItem.latestInternalNote || "None"}`,
  ].join("\n");
}

function buildConversationSnippet(history: AssistantMessage[]) {
  return history
    .slice(-8)
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.body}`)
    .join("\n");
}

function buildSystemInstruction(role: UserRole) {
  return [
    "You are MyGOV Agent 2.0, an embedded AI case assistant for a premium Malaysian-style GovTech workflow.",
    "Be calm, trustworthy, practical, and concise.",
    role === "admin"
      ? "The current user is an admin officer. Give operational guidance, decision support, and concise officer-ready summaries."
      : "The current user is a citizen. Use plain language, explain next steps clearly, and avoid bureaucratic phrasing.",
    "Stay grounded in the provided case, file, and timeline context.",
    "Do not invent laws, approvals, or unavailable evidence.",
    "If evidence is incomplete, say what is present and what is still missing.",
    "Prefer concrete next steps over generic advice.",
    "Return valid JSON only.",
  ].join(" ");
}

function buildUserPrompt(input: {
  prompt: string;
  role: UserRole;
  citizenName: string;
  caseItem?: CaseItem | null;
  history?: AssistantMessage[];
}) {
  return [
    `Citizen name: ${input.citizenName}`,
    `User role: ${input.role}`,
    `Case context:\n${buildCaseContext(input.caseItem)}`,
    input.history?.length
      ? `Recent conversation:\n${buildConversationSnippet(input.history)}`
      : "Recent conversation: none",
    `Current user prompt: ${input.prompt}`,
    "Respond with JSON using these fields:",
    '- "summaryTitle": a short heading',
    '- "reply": the main assistant response in under 220 words',
    '- "documentChecklist": 0 to 4 short document or evidence items',
    '- "nextSteps": 1 to 3 short, concrete next steps',
  ].join("\n\n");
}

function parseGeminiJson(text: string): GeminiAssistantPayload {
  const parsed = JSON.parse(text) as Partial<GeminiAssistantPayload>;

  return {
    summaryTitle:
      typeof parsed.summaryTitle === "string" && parsed.summaryTitle.trim()
        ? parsed.summaryTitle.trim()
        : "AI case guidance",
    reply:
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "I could not prepare a full response from Gemini.",
    documentChecklist: Array.isArray(parsed.documentChecklist)
      ? parsed.documentChecklist
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 4)
      : [],
    nextSteps: Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 3)
      : [],
  };
}

function formatAssistantReply(payload: GeminiAssistantPayload) {
  const sections = [payload.reply.trim()];

  if (payload.nextSteps.length) {
    sections.push(`Next steps: ${payload.nextSteps.join(" | ")}`);
  }

  return sections.filter(Boolean).join("\n\n");
}

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiAssistantReply(input: {
  prompt: string;
  role: UserRole;
  citizenName: string;
  caseItem?: CaseItem | null;
  history?: AssistantMessage[];
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: buildSystemInstruction(input.role) }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: buildUserPrompt(input),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.45,
        topP: 0.9,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            summaryTitle: {
              type: "string",
            },
            reply: {
              type: "string",
            },
            documentChecklist: {
              type: "array",
              items: { type: "string" },
            },
            nextSteps: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["reply", "documentChecklist", "nextSteps", "summaryTitle"],
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini request failed with ${response.status}: ${errorBody || "Unknown error"}`
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty assistant response.");
  }

  const parsed = parseGeminiJson(text);

  return {
    body: formatAssistantReply(parsed),
    attachments: parsed.documentChecklist,
    model,
    summaryTitle: parsed.summaryTitle,
    nextSteps: parsed.nextSteps,
    source: "gemini" as const,
  };
}
