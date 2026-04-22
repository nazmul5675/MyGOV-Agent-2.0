import Link from "next/link";
import { Bell, LogOut } from "lucide-react";

import { LogoMark } from "@/components/common/logo-mark";
import type { AppSession } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { isNavItemActive, roleNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Topbar({
  session,
  title,
  currentPath,
  unreadNotificationCount,
}: {
  session: AppSession;
  title: string;
  currentPath: string;
  unreadNotificationCount: number;
}) {
  const homeHref = session.role === "admin" ? "/admin" : "/dashboard";
  const quickLinks = roleNavigation[session.role].slice(0, 3);
  const unreadBadgeLabel =
    unreadNotificationCount > 99 ? "99+" : String(unreadNotificationCount);
  const showNotifications = session.role === "citizen";
  const adminAreaLabel =
    currentPath.startsWith("/admin/users")
      ? "Access control"
      : currentPath.startsWith("/admin/cases") || currentPath.startsWith("/admin/case-queue")
        ? "Case review operations"
        : "Operations dashboard";
  const citizenAreaLabel =
    currentPath.startsWith("/cases/new")
      ? "Create a case"
      : currentPath.startsWith("/cases/")
        ? "Case details"
        : currentPath.startsWith("/cases")
          ? "Your cases"
          : currentPath.startsWith("/notifications")
            ? "Notifications"
            : currentPath.startsWith("/profile")
              ? "Your profile"
              : "Your dashboard";

  return (
    <div className="glass-panel flex flex-col gap-2.5 rounded-[24px] px-4 py-3">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1.5">
          <Link
            href={homeHref}
            className="flex items-center gap-3 rounded-[24px] px-1 py-1 transition-colors hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 lg:hidden"
          >
            <LogoMark className="size-10 rounded-[18px]" />
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-bold tracking-tight text-primary">
                MyGOV Agent 2.0
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {session.role === "admin" ? "Admin home" : "Citizen home"}
              </p>
            </div>
          </Link>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {session.role === "admin" ? adminAreaLabel : citizenAreaLabel}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {title}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {showNotifications ? (
            <Link
              href="/notifications"
              className="relative flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,30,64,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            >
              <Bell className="size-4" />
              {unreadNotificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border border-white/80 bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground shadow-[0_8px_18px_rgba(0,30,64,0.2)]">
                  {unreadBadgeLabel}
                </span>
              ) : null}
            </Link>
          ) : null}
          <div className="hidden min-w-0 items-center gap-2 rounded-full bg-white/70 px-2 py-1.5 sm:flex">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {session.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 pr-2">
              <p className="truncate text-sm font-semibold text-foreground">{session.name}</p>
              <p className="truncate text-xs text-muted-foreground">{session.email}</p>
            </div>
          </div>
          <Link
            href="/api/auth/logout"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "rounded-full px-4"
            )}
          >
            <LogOut className="size-4" />
            Logout
          </Link>
        </div>
      </div>

      <div className="hidden flex-wrap items-center gap-2 pt-0.5 md:flex">
        {quickLinks.map((item) => {
          const active = isNavItemActive(currentPath, item);

          return (
            <Link
              key={`${session.role}-${item.href}`}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(0,30,64,0.16)]"
                  : "bg-white/70 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
