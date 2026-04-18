import type { ReactNode } from "react";
import Link from "next/link";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  sideContent: ReactNode;
  children: ReactNode;
  footerLink?: {
    href: string;
    label: string;
  };
};

export function AuthShell({
  badge,
  title,
  description,
  sideContent,
  children,
  footerLink,
}: AuthShellProps) {
  return (
    <div className="container-shell grid min-h-screen items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <div className="inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent-foreground">
          {badge}
        </div>
        <div className="space-y-4">
          <h1 className="text-balance text-5xl font-black tracking-tight text-primary">
            {title}
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="hero-gradient rounded-[32px] p-8 text-primary-foreground">
          {sideContent}
        </div>
        <Link
          href={footerLink?.href || "/"}
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {footerLink?.label || "Back to landing page"}
        </Link>
      </div>
      {children}
    </div>
  );
}
