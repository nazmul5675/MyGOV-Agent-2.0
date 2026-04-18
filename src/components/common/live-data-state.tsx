import type { ReactNode } from "react";
import { AlertTriangle, DatabaseZap } from "lucide-react";

type LiveDataStateTone = "setup" | "error";

const toneStyles: Record<
  LiveDataStateTone,
  { icon: ReactNode; iconClassName: string }
> = {
  setup: {
    icon: <DatabaseZap className="size-6" />,
    iconClassName: "bg-[#e9f2ff] text-[#234a9f]",
  },
  error: {
    icon: <AlertTriangle className="size-6" />,
    iconClassName: "bg-[#ffe6de] text-[#a33a2f]",
  },
};

export function LiveDataState({
  title,
  description,
  tone = "error",
  action,
}: {
  title: string;
  description: string;
  tone?: LiveDataStateTone;
  action?: ReactNode;
}) {
  const styles = toneStyles[tone];

  return (
    <div className="surface-panel flex flex-col items-center justify-center gap-4 px-8 py-14 text-center">
      <div
        className={`flex size-14 items-center justify-center rounded-full ${styles.iconClassName}`}
      >
        {styles.icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
