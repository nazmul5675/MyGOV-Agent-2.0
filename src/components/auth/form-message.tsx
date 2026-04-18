import { cn } from "@/lib/utils";

export function FormMessage({
  message,
  tone = "error",
}: {
  message?: string;
  tone?: "error" | "muted" | "success";
}) {
  if (!message) return null;

  return (
    <p
      className={cn("text-sm leading-6", {
        "text-destructive": tone === "error",
        "text-muted-foreground": tone === "muted",
        "text-[#1d7d49]": tone === "success",
      })}
    >
      {message}
    </p>
  );
}
