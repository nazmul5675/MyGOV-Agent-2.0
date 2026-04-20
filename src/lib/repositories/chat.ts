import "server-only";

import type { AssistantMessage } from "@/lib/types";
import { getMongoCollections } from "@/lib/repositories/bootstrap";
import type { ChatMessageDocument } from "@/types/models";

export async function listChatMessagesForThread(input: {
  userId?: string;
  caseId?: string;
  threadKey: string;
}) {
  const { chatMessages } = await getMongoCollections();

  if (input.caseId) {
    return chatMessages
      .find({
        $or: [{ caseId: input.caseId }, { threadKey: input.threadKey }],
      })
      .sort({ createdAt: 1 })
      .toArray();
  }

  return chatMessages
    .find({
      userId: input.userId,
      threadKey: input.threadKey,
    })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function appendChatMessageRecord(record: ChatMessageDocument) {
  const { chatMessages } = await getMongoCollections();
  await chatMessages.insertOne(record);

  return {
    id: record.id,
    role: record.role,
    body: record.body,
    createdAt: record.createdAt,
    caseId: record.caseId,
    threadKey: record.threadKey,
    attachments: record.attachments,
  } satisfies AssistantMessage;
}
