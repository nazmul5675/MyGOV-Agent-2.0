import Link from "next/link";

import { AppModeBadge } from "@/components/common/app-mode-badge";
import { LogoMark } from "@/components/common/logo-mark";
import type { UserRole } from "@/lib/types";
import { roleNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar({
  role,
  currentPath,
}: {
  role: UserRole;
  currentPath: string;
}) {
  const homeHref = role === "admin" ? "/admin" : "/dashboard";

  return (
    <aside className="glass-panel hidden w-[286px] shrink-0 flex-col rounded-[32px] p-5 lg:flex">
      <Link
        href={homeHref}
        className="flex items-center gap-3 rounded-[24px] px-2 py-3 transition-colors hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <LogoMark />
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold tracking-tight text-primary">
            MyGOV Agent 2.0
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {role === "admin" ? "Admin Workspace" : "Citizen Workspace"}
          </p>
          <div className="mt-2">
            <AppModeBadge />
          </div>
        </div>
      </Link>
      <nav className="mt-8 space-y-2">
        {roleNavigation[role].map((item) => {
          const Icon = item.icon;
          const active =
            currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link
              key={`${role}-${item.href}`}
              href={item.href}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(0,30,64,0.18)]"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-[28px] bg-primary px-5 py-5 text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
          System readiness
        </p>
        <p className="mt-2 font-heading text-2xl font-bold tracking-tight">
          Ready to route
        </p>
        <p className="mt-3 text-sm leading-6 text-primary-foreground/75">
          Live case routing, file handling, and assistant guidance are available from this workspace.
        </p>
      </div>
    </aside>
  );
}
