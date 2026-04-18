"use client";

import Link from "next/link";
import {
  Bell,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const mobileRoleNav = {
  citizen: [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/cases/new", label: "New", icon: Sparkles },
    { href: "/dashboard", label: "Cases", icon: LayoutDashboard },
    { href: "/notifications", label: "Alerts", icon: Bell },
  ],
  admin: [
    { href: "/admin", label: "Queue", icon: LayoutDashboard },
    { href: "/admin", label: "Review", icon: ShieldCheck },
    { href: "/admin", label: "Alerts", icon: Bell },
  ],
};

export function MobileNav({
  role,
  currentPath,
}: {
  role: UserRole;
  currentPath: string;
}) {
  return (
    <nav className="glass-panel fixed inset-x-4 bottom-4 z-40 rounded-[28px] px-3 py-2 lg:hidden">
      <div className="grid grid-cols-4 gap-2">
        {mobileRoleNav[role].map((item) => {
          const Icon = item.icon;
          const active =
            currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link
              key={`${role}-${item.href}`}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-[20px] px-3 py-3 text-[11px] font-semibold transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_14px_24px_rgba(0,30,64,0.18)]"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
