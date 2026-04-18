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
    <div className="surface-panel relative overflow-hidden p-6">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative flex items-start justify-between gap-5">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-black tracking-tight text-primary">{value}</p>
          <p className="text-sm text-muted-foreground">{change}</p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}
