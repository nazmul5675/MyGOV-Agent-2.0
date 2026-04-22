import Link from "next/link";

import { LogoMark } from "@/components/common/logo-mark";
import type { UserRole } from "@/lib/types";
import { isNavItemActive, roleNavigation } from "@/lib/navigation";
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
    <aside className="glass-panel hidden w-[258px] shrink-0 flex-col rounded-[28px] p-3.5 lg:flex">
      <Link
        href={homeHref}
        className="flex items-center gap-3 rounded-[20px] px-2 py-2 transition-colors hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <LogoMark className="size-10 rounded-[18px]" />
        <div className="min-w-0">
          <p className="font-heading text-base font-bold tracking-tight text-primary">
            MyGOV Agent 2.0
          </p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {role === "admin" ? "Admin Workspace" : "Citizen Workspace"}
          </p>
        </div>
      </Link>
      <nav className="mt-5 space-y-1">
        {roleNavigation[role].map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(currentPath, item);

          return (
            <Link
              key={`${role}-${item.href}`}
              href={item.href}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-[18px] px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(0,30,64,0.18)]"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-[14px]",
                  active ? "bg-white/12" : "bg-white/55"
                )}
              >
                <Icon className="size-4 shrink-0" />
              </span>
              <span className="min-w-0">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-[22px] bg-primary px-4 py-4 text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
          System readiness
        </p>
        <p className="mt-2 font-heading text-lg font-bold tracking-tight">
          Ready to route
        </p>
        <p className="mt-2 text-sm leading-6 text-primary-foreground/75">
          Live case routing, file handling, and assistant guidance are available from this workspace.
        </p>
      </div>
    </aside>
  );
}
