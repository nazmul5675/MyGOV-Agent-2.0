"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bot,
  LoaderCircle,
  SendHorizonal,
  Sparkles,
  TriangleAlert,
  User2,
} from "lucide-react";
import { toast } from "sonner";

import { sendAssistantMessage } from "@/lib/actions/cases";
import type { AssistantMessage, AssistantResponseMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const starterPrompts = [
  "What documents do I need?",
  "Help me explain my issue",
  "Summarize my uploads",
  "What should I do next?",
  "Check if I missed anything",
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AssistantPanel({
  title = "AI case guide",
  subtitle,
  caseId,
  initialMessages,
  suggestedPrompts = starterPrompts,
}: {
  title?: string;
  subtitle?: string;
  caseId?: string;
  initialMessages: AssistantMessage[];
  suggestedPrompts?: string[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [assistantMeta, setAssistantMeta] = useState<AssistantResponseMeta | null>(null);
  const [isPending, startTransition] = useTransition();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isEmpty = !messages.length;

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const quickPrompts = useMemo(
    () => suggestedPrompts.filter((prompt) => !messages.some((item) => item.body === prompt)),
    [messages, suggestedPrompts]
  );

  const handleSend = (body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        const response = await sendAssistantMessage({
          body: trimmed,
          caseId,
        });
        setAssistantMeta(response.assistantMeta);

        setMessages((current) => [
          ...current,
          {
            id: response.userMessage.id,
            role: "user",
            body: response.userMessage.body,
            createdAt: response.userMessage.createdAt,
            caseId,
            threadKey: caseId ? `case:${caseId}` : "dashboard",
          },
          {
            id: response.assistantMessage.id,
            role: "assistant",
            body: response.assistantMessage.body,
            createdAt: response.assistantMessage.createdAt,
            caseId,
            threadKey: caseId ? `case:${caseId}` : "dashboard",
            attachments: response.assistantMessage.attachments || [],
          },
        ]);
        setDraft("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to send message.");
      }
    });
  };

  return (
    <section className="surface-panel flex min-h-[32rem] flex-col p-5 sm:min-h-[35rem] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            {title}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {subtitle ||
              "Ask for document guidance, upload checks, next steps, or a cleaner explanation before you submit or follow up."}
          </p>
        </div>
        <div className="self-start rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground">
          Case-aware assistant
        </div>
      </div>

      <div
        ref={viewportRef}
        className="mt-5 flex-1 space-y-4 overflow-y-auto rounded-[26px] bg-muted/55 p-4"
      >
        {isEmpty ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-[24px] border border-dashed border-primary/20 bg-white/70 px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-4 font-semibold text-foreground">Start with guided help</p>
            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              This assistant uses the current case, file, and dashboard context to generate guided help, cleaner summaries, and next-step recommendations.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" ? (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </div>
              ) : null}
              <div
                className={cn(
                  "max-w-[90%] break-words rounded-[22px] px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:max-w-[85%]",
                  message.role === "assistant"
                    ? "bg-white text-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <p className="text-sm leading-7 whitespace-pre-wrap">{message.body}</p>
                {message.attachments?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <span
                        key={attachment}
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                          message.role === "assistant"
                            ? "bg-primary/10 text-primary"
                            : "bg-white/15 text-white"
                        )}
                      >
                        {attachment}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p
                  className={cn(
                    "mt-2 text-[11px] uppercase tracking-[0.18em]",
                    message.role === "assistant"
                      ? "text-muted-foreground"
                      : "text-primary-foreground/70"
                  )}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
              {message.role === "user" ? (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <User2 className="size-4" />
                </div>
              ) : null}
            </div>
          ))
        )}
        {isPending ? (
          <div className="flex items-center gap-3 rounded-[24px] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="size-4" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Preparing the next guidance step...
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrompts.slice(0, 4).map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            className="rounded-full border border-primary/15 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-[26px] border border-border/70 bg-white/85 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        {assistantMeta?.notice ? (
          <div
            className={cn(
              "mb-3 flex items-start gap-3 rounded-[22px] border px-4 py-3 text-sm",
              assistantMeta.source === "gemini"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            )}
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p className="leading-6">{assistantMeta.notice}</p>
          </div>
        ) : null}
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder="Ask what to upload, how to explain your issue, or what to do next."
          className="min-h-24 rounded-[22px] border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="min-w-0 text-xs leading-6 text-muted-foreground">
            {assistantMeta?.source === "gemini" && assistantMeta.model
              ? `Live Gemini is active with ${assistantMeta.model}.`
              : "The assistant uses case and file context from the prototype data layer and upgrades to live Gemini responses whenever the API key is configured."}
          </p>
          <Button
            type="button"
            className="w-full rounded-2xl px-5 sm:w-auto"
            disabled={isPending || draft.trim().length < 4}
            onClick={() => handleSend(draft)}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
            Send
          </Button>
        </div>
      </div>
    </section>
  );
}
