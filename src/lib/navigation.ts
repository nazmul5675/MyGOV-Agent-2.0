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
      href: "/admin#queue",
      label: "Case Queue",
      shortLabel: "Queue",
      icon: ListTodo,
      matchPrefixes: ["/admin/cases"],
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

export function isNavItemActive(currentPath: string, item: AppNavItem) {
  const normalizedHref = item.href.split("#")[0];

  if (item.matchPrefixes?.length) {
    return item.matchPrefixes.some((prefix) =>
      currentPath === prefix || currentPath.startsWith(`${prefix}/`)
    );
  }

  if (item.exact) {
    return currentPath === normalizedHref;
  }

  return currentPath === normalizedHref || currentPath.startsWith(`${normalizedHref}/`);
}
