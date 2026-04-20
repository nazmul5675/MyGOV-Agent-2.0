"use client";

import { useEffect, useState } from "react";

export function useGoogleMaps(apiKey?: string) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    apiKey && typeof window !== "undefined" && window.google?.maps ? "ready" : apiKey ? "loading" : "idle"
  );

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    if (window.google?.maps) {
      return;
    }

    if (!window.__mygovGoogleMapsLoader__) {
      window.__mygovGoogleMapsLoader__ = new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[data-google-maps-loader="true"]'
        );
        if (existing) {
          existing.addEventListener("load", () => {
            if (window.google) resolve(window.google);
          });
          existing.addEventListener("error", () =>
            reject(new Error("Google Maps script failed to load."))
          );
          return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
        script.async = true;
        script.defer = true;
        script.dataset.googleMapsLoader = "true";
        script.onload = () => {
          if (window.google) {
            resolve(window.google);
          } else {
            reject(new Error("Google Maps loaded without the expected global object."));
          }
        };
        script.onerror = () => reject(new Error("Google Maps script failed to load."));
        document.head.appendChild(script);
      });
    }

    window.__mygovGoogleMapsLoader__
      ?.then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, [apiKey]);

  const resolvedStatus =
    !apiKey ? "idle" : status === "idle" ? "loading" : status;

  return {
    status: resolvedStatus,
    isReady:
      status === "ready" || Boolean(apiKey && typeof window !== "undefined" && window.google?.maps),
  };
}
