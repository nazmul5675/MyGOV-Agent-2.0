"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="container-shell flex min-h-screen items-center justify-center py-16">
        <div className="surface-panel max-w-xl space-y-5 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#ffe6de] text-[#a33a2f]">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Something went wrong
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {error.message ||
                "The application hit an unexpected error while loading this page."}
            </p>
          </div>
          <Button onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
