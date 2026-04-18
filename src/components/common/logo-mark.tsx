import { Landmark } from "lucide-react";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(0,30,64,0.18)]",
        className
      )}
    >
      <Landmark className="size-5" />
    </div>
  );
}
