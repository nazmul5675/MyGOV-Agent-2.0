import "server-only";

import type { AssistantMessage, CaseItem, EvidenceFile } from "@/lib/types";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

function buildCaseContext(caseItem?: CaseItem | null) {
  if (!caseItem) {
    return "No specific case is open. Focus on general document guidance, next steps, and citizen-friendly explanations.";
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

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiAssistantReply(input: {
  prompt: string;
  role: "citizen" | "admin";
  citizenName: string;
  caseItem?: CaseItem | null;
  history?: AssistantMessage[];
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = [
    "You are MyGOV Agent 2.0, an embedded case assistant for a Malaysian-style GovTech workflow.",
    "Be clear, calm, concise, and practical.",
    `The current user is an ${input.role}.`,
    "Help with document guidance, next steps, case summaries, missing document checklists, and status explanations.",
    "Do not invent laws or guarantee approvals.",
    "If the user asks about files, mention which files appear present and which items still look missing.",
    "If speaking to an admin, produce operational guidance and a short officer-ready summary when useful.",
    "If speaking to a citizen, produce plain-language guidance and reassure them about the next concrete step.",
  ].join(" ");

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: [
            systemPrompt,
            `Citizen name: ${input.citizenName}`,
            `Case context:\n${buildCaseContext(input.caseItem)}`,
            input.history?.length
              ? `Recent conversation:\n${buildConversationSnippet(input.history)}`
              : "Recent conversation: none",
            `Current prompt: ${input.prompt}`,
            "Respond in under 220 words. If useful, use short bullets. End with the clearest next step.",
          ].join("\n\n"),
        },
      ],
    },
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 400,
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

  return text;
}
