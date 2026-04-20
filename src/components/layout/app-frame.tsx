import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";
import type { AppSession } from "@/lib/types";

export function AppFrame({
  session,
  title,
  currentPath,
  children,
}: {
  session: AppSession;
  title: string;
  currentPath: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-shell grid min-h-screen gap-6 py-6 pb-28 lg:grid-cols-[286px_minmax(0,1fr)] lg:pb-6">
      <AppSidebar role={session.role} currentPath={currentPath} />
      <main className="min-w-0 space-y-6">
        <Topbar session={session} title={title} currentPath={currentPath} />
        {children}
      </main>
      <MobileNav role={session.role} currentPath={currentPath} />
    </div>
  );
}
