import type { AssistantResponseMeta, CaseItem, UserRole } from "@/lib/types";

function includesAny(input: string, patterns: string[]) {
  return patterns.some((pattern) => input.includes(pattern));
}

export function buildAssistantReply(input: {
  prompt: string;
  caseItem?: CaseItem | null;
  citizenName?: string;
  role?: UserRole;
}) {
  const normalized = input.prompt.toLowerCase();
  const caseTitle = input.caseItem?.title || "your case";
  const missingDocs = input.caseItem?.intake.missingDocuments || [];
  const evidenceCount = input.caseItem?.evidence.length || 0;
  const isAdmin = input.role === "admin";
  let reply: string;

  if (includesAny(normalized, ["what documents", "missing", "missed anything"])) {
    if (missingDocs.length) {
      reply = `For ${caseTitle}, the current checklist still points to: ${missingDocs.join(", ")}. If you already have them, upload the clearest copy you can and mention what each file proves in your note.`;
      return {
        reply,
        attachments: missingDocs.slice(0, 4),
      };
    }

    reply = `There are no missing documents flagged right now for ${caseTitle}. The strongest next upload is usually one identity or location document plus one file that proves the issue, such as a photo, official letter, or supporting receipt.`;
    return {
      reply,
      attachments: [],
    };
  }

  if (includesAny(normalized, ["summarize", "uploads", "evidence", "file"])) {
    reply = evidenceCount
      ? `I can see ${evidenceCount} uploaded file${evidenceCount === 1 ? "" : "s"} linked to ${caseTitle}. A good next step is to label what each file shows, then ask the admin-facing workflow to review whether anything needs a clearer copy.`
      : `No files are attached to ${caseTitle} yet. Start with one strong proof document or photo, then add a short explanation so the review team understands why each upload matters.`;
    return {
      reply,
      attachments: missingDocs.slice(0, 4),
    };
  }

  if (includesAny(normalized, ["status", "next", "what should i do"])) {
    const status = input.caseItem?.status?.replaceAll("_", " ") || "submitted";
    reply = `The current status for ${caseTitle} is ${status}. Your best next step is to check the latest timeline item, confirm whether any follow-up documents were requested, and keep your file list complete so the case can move forward without delay.`;
    return {
      reply,
      attachments: missingDocs.slice(0, 4),
    };
  }

  if (includesAny(normalized, ["officer", "admin summary", "draft an officer summary"])) {
    reply = isAdmin
      ? `Officer summary: ${caseTitle} is currently ${input.caseItem?.status?.replaceAll("_", " ") || "submitted"}. Focus on the citizen summary, the evidence already attached, and any missing documents before deciding whether to review, route, or request a better copy.`
      : `I can help you prepare a cleaner case summary first, then the admin team can turn it into an officer-facing note during review.`;
    return {
      reply,
      attachments: missingDocs.slice(0, 4),
    };
  }

  if (includesAny(normalized, ["explain", "issue", "help me"])) {
    reply = `Start with three facts: what happened, where it happened, and what outcome you need. Then add the strongest supporting file you have. I can help you turn a rough explanation into a cleaner case summary once your details and uploads are in place.`;
    return {
      reply,
      attachments: missingDocs.slice(0, 4),
    };
  }

  reply = `I can help with document readiness, clearer case summaries, upload checks, and next-step guidance${input.citizenName ? ` for ${input.citizenName}` : ""}. Ask about required documents, what a status means, or whether your uploads look complete.`;
  return {
    reply,
    attachments: missingDocs.slice(0, 4),
  };
}

export function buildAssistantFallbackNotice(input: {
  hadGeminiKey: boolean;
  failure?: unknown;
}): AssistantResponseMeta {
  if (!input.hadGeminiKey) {
    return {
      source: "prototype-fallback",
      notice: "Gemini is not configured yet, so the assistant is using the built-in workflow guide.",
    };
  }

  return {
    source: "prototype-fallback",
    notice:
      input.failure instanceof Error
        ? "Gemini is temporarily unavailable, so the assistant switched to the built-in workflow guide."
        : "Gemini is temporarily unavailable, so the assistant switched to the built-in workflow guide.",
  };
}
