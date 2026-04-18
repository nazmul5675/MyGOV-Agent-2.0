import {
  Bell,
  Globe2,
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
};

export const roleNavigation: Record<UserRole, AppNavItem[]> = {
  citizen: [
    {
      href: "/dashboard",
      label: "Dashboard",
      shortLabel: "Home",
      icon: LayoutDashboard,
    },
    {
      href: "/cases/new",
      label: "Create Case",
      shortLabel: "New",
      icon: Sparkles,
    },
    {
      href: "/notifications",
      label: "Notifications",
      shortLabel: "Alerts",
      icon: Bell,
    },
    {
      href: "/profile",
      label: "Profile",
      shortLabel: "Profile",
      icon: UserRound,
    },
  ],
  admin: [
    {
      href: "/admin",
      label: "Operations Dashboard",
      shortLabel: "Ops",
      icon: ShieldCheck,
    },
    {
      href: "/profile",
      label: "Profile",
      shortLabel: "Profile",
      icon: UserRound,
    },
    {
      href: "/",
      label: "Public Site",
      shortLabel: "Site",
      icon: Globe2,
    },
  ],
};
