import Link from "next/link";
import {
  Bell,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { LogoMark } from "@/components/common/logo-mark";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const roleNav = {
  citizen: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/cases/new", label: "Create Case", icon: Sparkles },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: UserRound },
  ],
  admin: [
    { href: "/admin", label: "Case Queue", icon: LayoutDashboard },
    { href: "/admin", label: "Review Center", icon: ShieldCheck },
    { href: "/admin", label: "Operations", icon: Settings2 },
  ],
};

export function AppSidebar({
  role,
  currentPath,
}: {
  role: UserRole;
  currentPath: string;
}) {
  return (
    <aside className="glass-panel hidden w-[286px] shrink-0 flex-col rounded-[32px] p-5 lg:flex">
      <div className="flex items-center gap-3 px-2 py-3">
        <LogoMark />
        <div>
          <p className="font-heading text-lg font-bold tracking-tight text-primary">
            MyGOV Agent 2.0
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {role === "admin" ? "Admin Workspace" : "Citizen Workspace"}
          </p>
        </div>
      </div>
      <nav className="mt-8 space-y-2">
        {roleNav[role].map((item) => {
          const Icon = item.icon;
          const active =
            currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link
              key={`${role}-${item.href}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(0,30,64,0.18)]"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-[28px] bg-primary px-5 py-5 text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
          System readiness
        </p>
        <p className="mt-2 font-heading text-2xl font-bold tracking-tight">
          Secure and live
        </p>
        <p className="mt-3 text-sm leading-6 text-primary-foreground/75">
          Session cookies, role guards, and Firebase hooks are ready for
          production setup.
        </p>
      </div>
    </aside>
  );
}
