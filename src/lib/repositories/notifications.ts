import type { NotificationItem } from "@/lib/types";
import { requireDb } from "@/lib/repositories/firestore-helpers";

export async function listNotificationsForUser(
  userId: string
): Promise<NotificationItem[]> {
  const db = requireDb();

  const snapshot = await db
    .collection("notifications")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(24)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: String(data.userId || userId),
      title: String(data.title || "Notification"),
      body: String(data.body || ""),
      createdAt: String(data.createdAt || ""),
      read: Boolean(data.read),
      tone:
        data.tone === "warning" || data.tone === "success" ? data.tone : "info",
      actionHref: data.actionHref ? String(data.actionHref) : undefined,
    } satisfies NotificationItem;
  });
}
