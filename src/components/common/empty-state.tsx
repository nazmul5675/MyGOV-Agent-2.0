import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-panel flex flex-col items-center justify-center gap-4 px-8 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="max-w-md text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
