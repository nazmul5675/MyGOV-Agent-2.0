import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export function SuccessBlock({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[#cde9d7] bg-[#f4fbf6] p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-11 items-center justify-center rounded-full bg-[#dff3e7] text-[#1d7d49]">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-7 text-muted-foreground">{description}</p>
          {action}
        </div>
      </div>
    </div>
  );
}
