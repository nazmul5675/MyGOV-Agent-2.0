import { headers } from "next/headers";

import { AppFrame } from "@/components/layout/app-frame";
import { requireSession } from "@/lib/auth/session";
import {
  countUnreadNotificationsForUser,
  markNotificationsAsReadForUser,
} from "@/lib/repositories/notifications";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const pathname = (await headers()).get("x-current-path") || "/dashboard";

  if (pathname === "/notifications" || pathname.startsWith("/notifications/")) {
    await markNotificationsAsReadForUser(session.uid);
  }

  const unreadNotificationCount = await countUnreadNotificationsForUser(session.uid);

  return (
    <AppFrame
      session={session}
      title="Workspace"
      currentPath={pathname}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppFrame>
  );
}
