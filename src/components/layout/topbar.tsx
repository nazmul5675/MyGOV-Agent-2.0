import Link from "next/link";
import { Bell, LogOut } from "lucide-react";

import type { AppSession } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { roleNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Topbar({
  session,
  title,
  currentPath,
}: {
  session: AppSession;
  title: string;
  currentPath: string;
}) {
  const noticeHref = session.role === "citizen" ? "/notifications" : "/admin";
  const quickLinks = roleNavigation[session.role].slice(0, 3);

  return (
    <div className="glass-panel flex flex-col gap-4 rounded-[28px] px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {session.role === "admin" ? "Admin portal" : "Citizen portal"}
          </p>
          <p className="font-heading text-xl font-bold tracking-tight text-foreground">
            {title}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={noticeHref}
            className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,30,64,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <Bell className="size-4" />
          </Link>
          <div className="hidden items-center gap-3 rounded-full bg-white/70 px-2 py-2 sm:flex">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {session.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="pr-2">
              <p className="text-sm font-semibold text-foreground">{session.name}</p>
              <p className="text-xs text-muted-foreground">{session.email}</p>
            </div>
          </div>
          <Link
            href="/api/auth/logout"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full px-4"
            )}
          >
            <LogOut className="size-4" />
            Logout
          </Link>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        {quickLinks.map((item) => {
          const active =
            currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link
              key={`${session.role}-${item.href}`}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
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
