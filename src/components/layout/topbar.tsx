import Link from "next/link";
import { Bell, LogOut } from "lucide-react";

import type { AppSession } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Topbar({
  session,
  title,
}: {
  session: AppSession;
  title: string;
}) {
  return (
    <div className="glass-panel flex items-center justify-between rounded-[28px] px-5 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {session.role === "admin" ? "Admin portal" : "Citizen portal"}
        </p>
        <p className="font-heading text-xl font-bold tracking-tight text-foreground">
          {title}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform hover:-translate-y-0.5">
          <Bell className="size-4" />
        </button>
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
  );
}
