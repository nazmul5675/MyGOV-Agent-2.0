"use client";

import Link from "next/link";

import type { UserRole } from "@/lib/types";
import { isNavItemActive, roleNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav({
  role,
  currentPath,
  unreadNotificationCount,
}: {
  role: UserRole;
  currentPath: string;
  unreadNotificationCount: number;
}) {
  const navItems = roleNavigation[role];

  return (
    <nav className="glass-panel fixed inset-x-4 bottom-4 z-40 rounded-[28px] px-3 py-2 lg:hidden">
      <div
        className={cn(
          "grid gap-2",
          navItems.length === 4 ? "grid-cols-4" : "grid-cols-3"
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(currentPath, item);
          const showUnreadBadge =
            item.href === "/notifications" && unreadNotificationCount > 0;
          const unreadBadgeLabel =
            unreadNotificationCount > 9 ? "9+" : String(unreadNotificationCount);

          return (
            <Link
              key={`${role}-${item.href}`}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-3 text-center text-[11px] font-semibold leading-tight transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_14px_24px_rgba(0,30,64,0.18)]"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span className="relative inline-flex">
                <Icon className="size-4" />
                {showUnreadBadge ? (
                  <span className="absolute -right-2.5 -top-2 inline-flex min-w-4 items-center justify-center rounded-full border border-white/80 bg-primary px-1 py-0.5 text-[9px] font-bold leading-none text-primary-foreground shadow-[0_6px_14px_rgba(0,30,64,0.18)]">
                    {unreadBadgeLabel}
                  </span>
                ) : null}
              </span>
              <span className="min-w-0">{item.shortLabel || item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
