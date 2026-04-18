import type { NotificationItem } from "@/lib/types";
import { requireDb } from "@/lib/repositories/firestore-helpers";

export async function createNotificationForUser(
  userId: string,
  notification: Omit<NotificationItem, "id">
) {
  const db = requireDb();

  await db
    .collection("users")
    .doc(userId)
    .collection("notifications")
    .add(notification);
}

export async function listNotificationsForUser(
  userId: string
): Promise<NotificationItem[]> {
  const db = requireDb();

  const snapshot = await db
    .collection("users")
    .doc(userId)
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .limit(24)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
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
