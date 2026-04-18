import Link from "next/link";

import { LogoMark } from "@/components/common/logo-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-background/80 backdrop-blur-2xl">
      <div className="container-shell flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="font-heading text-lg font-bold tracking-tight text-primary">
              MyGOV Agent 2.0
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Citizens First
            </p>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 lg:flex">
          {[
            { href: "#journey", label: "Journey" },
            { href: "#features", label: "Features" },
            { href: "#trust", label: "Trust" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full px-5"
            )}
          >
            Login
          </Link>
          <Link
            href="/cases/new"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-5")}
          >
            Start a case
          </Link>
        </div>
      </div>
    </header>
  );
}
