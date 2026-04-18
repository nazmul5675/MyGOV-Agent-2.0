import { headers } from "next/headers";

import { AppFrame } from "@/components/layout/app-frame";
import { requireSession } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const pathname = (await headers()).get("x-current-path") || "/dashboard";

  return (
    <AppFrame session={session} title="Workspace" currentPath={pathname}>
      {children}
    </AppFrame>
  );
}
