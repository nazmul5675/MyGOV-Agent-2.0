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
  const title =
    session.role === "admin"
      ? "Workspace"
      : pathname.startsWith("/cases/new")
        ? "Create case"
        : pathname.startsWith("/cases/")
          ? "Case detail"
          : pathname.startsWith("/cases")
            ? "Your cases"
            : pathname.startsWith("/notifications")
              ? "Notifications"
              : pathname.startsWith("/profile")
                ? "Profile"
                : "Dashboard";

  return (
    <AppFrame
      session={session}
      title={title}
      currentPath={pathname}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppFrame>
  );
}
