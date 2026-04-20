import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: ReactNode;
}) {
  return (
    <div className="surface-panel interactive-lift relative flex h-full min-h-[8.2rem] overflow-hidden p-4 transition-transform duration-300 sm:p-5">
      <div className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative flex w-full flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="text-[1.85rem] font-black leading-none tracking-tight text-primary">
              {value}
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[18px] bg-accent text-accent-foreground">
            {icon}
          </div>
        </div>
        <p className="max-w-[24ch] text-sm leading-5 text-muted-foreground">{change}</p>
      </div>
    </div>
  );
}
