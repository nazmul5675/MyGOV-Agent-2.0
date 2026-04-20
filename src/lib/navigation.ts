import {
  Bell,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/lib/types";

export type AppNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
};

export const roleNavigation: Record<UserRole, AppNavItem[]> = {
  citizen: [
    {
      href: "/dashboard",
      label: "Command Center",
      shortLabel: "Home",
      icon: LayoutDashboard,
      matchPrefixes: ["/dashboard", "/cases"],
    },
    {
      href: "/cases/new",
      label: "New Case",
      shortLabel: "New",
      icon: Sparkles,
      matchPrefixes: ["/cases/new"],
    },
    {
      href: "/notifications",
      label: "Alerts",
      shortLabel: "Alerts",
      icon: Bell,
      matchPrefixes: ["/notifications"],
    },
    {
      href: "/profile",
      label: "Account",
      shortLabel: "Account",
      icon: UserRound,
      matchPrefixes: ["/profile"],
    },
  ],
  admin: [
    {
      href: "/admin",
      label: "Control Center",
      shortLabel: "Admin",
      icon: ShieldCheck,
      matchPrefixes: ["/admin"],
    },
    {
      href: "/profile",
      label: "Account",
      shortLabel: "Account",
      icon: UserRound,
      matchPrefixes: ["/profile"],
    },
  ],
};
