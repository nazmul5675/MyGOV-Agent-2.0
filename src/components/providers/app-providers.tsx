"use client";

import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          className: "glass-panel text-foreground",
        }}
      />
    </>
  );
}
