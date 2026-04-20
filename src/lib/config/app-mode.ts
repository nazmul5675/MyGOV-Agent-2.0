export type AppMode = "prototype" | "live";

const DEFAULT_MODE: AppMode = "live";

export function getAppMode(): AppMode {
  const raw =
    process.env.NEXT_PUBLIC_APP_MODE?.trim().toLowerCase() ||
    process.env.APP_MODE?.trim().toLowerCase();
  return raw === "live" ? "live" : DEFAULT_MODE;
}

export function isPrototypeMode() {
  return getAppMode() === "prototype";
}

export function isLiveMode() {
  return getAppMode() === "live";
}
