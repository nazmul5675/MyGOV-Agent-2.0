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
    <div className="surface-panel interactive-lift relative flex h-full min-h-[10.5rem] overflow-hidden p-5 transition-transform duration-300">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative flex w-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-sm leading-6 text-muted-foreground">{label}</p>
            <p className="text-[2rem] font-black leading-none tracking-tight text-primary">{value}</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            {icon}
          </div>
        </div>
        <p className="max-w-[22ch] text-sm leading-6 text-muted-foreground">{change}</p>
      </div>
    </div>
  );
}
