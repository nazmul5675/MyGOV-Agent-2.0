import {
  Bell,
  LayoutDashboard,
  ListTodo,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users2,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/lib/types";

export type AppNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
  excludePrefixes?: string[];
  exact?: boolean;
};

export const roleNavigation: Record<UserRole, AppNavItem[]> = {
  citizen: [
    {
      href: "/dashboard",
      label: "Dashboard",
      shortLabel: "Home",
      icon: LayoutDashboard,
      matchPrefixes: ["/dashboard", "/cases"],
      excludePrefixes: ["/cases/new"],
    },
    {
      href: "/cases/new",
      label: "Create Case",
      shortLabel: "New",
      icon: Sparkles,
      exact: true,
    },
    {
      href: "/notifications",
      label: "Notifications",
      shortLabel: "Alerts",
      icon: Bell,
      matchPrefixes: ["/notifications"],
    },
    {
      href: "/profile",
      label: "Profile",
      shortLabel: "Profile",
      icon: UserRound,
      matchPrefixes: ["/profile"],
    },
  ],
  admin: [
    {
      href: "/admin",
      label: "Dashboard",
      shortLabel: "Home",
      icon: ShieldCheck,
      exact: true,
    },
    {
      href: "/admin/case-queue",
      label: "Case Queue",
      shortLabel: "Queue",
      icon: ListTodo,
      matchPrefixes: ["/admin/case-queue", "/admin/cases"],
    },
    {
      href: "/admin/users",
      label: "Users",
      shortLabel: "Users",
      icon: Users2,
      matchPrefixes: ["/admin/users"],
    },
    {
      href: "/profile",
      label: "Profile",
      shortLabel: "Profile",
      icon: UserRound,
      matchPrefixes: ["/profile"],
    },
  ],
};

function normalizePath(path: string) {
  const [withoutHash] = path.split("#");
  const [withoutQuery] = withoutHash.split("?");

  if (!withoutQuery) return "/";
  if (withoutQuery === "/") return "/";

  return withoutQuery.endsWith("/") ? withoutQuery.slice(0, -1) : withoutQuery;
}

export function isNavItemActive(currentPath: string, item: AppNavItem) {
  const normalizedCurrentPath = normalizePath(currentPath);
  const normalizedHref = normalizePath(item.href);
  const matchesExcludedPrefix = item.excludePrefixes?.some((prefix) => {
    const normalizedPrefix = normalizePath(prefix);

    return (
      normalizedCurrentPath === normalizedPrefix ||
      normalizedCurrentPath.startsWith(`${normalizedPrefix}/`)
    );
  });

  if (matchesExcludedPrefix) {
    return false;
  }

  if (item.matchPrefixes?.length) {
    return item.matchPrefixes.some((prefix) => {
      const normalizedPrefix = normalizePath(prefix);

      return (
        normalizedCurrentPath === normalizedPrefix ||
        normalizedCurrentPath.startsWith(`${normalizedPrefix}/`)
      );
    });
  }

  if (item.exact) {
    return normalizedCurrentPath === normalizedHref;
  }

  return (
    normalizedCurrentPath === normalizedHref ||
    normalizedCurrentPath.startsWith(`${normalizedHref}/`)
  );
}
