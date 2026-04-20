import Link from "next/link";
import { ExternalLink, MapPin, Navigation, TimerReset } from "lucide-react";

import type { CaseLocationMeta } from "@/lib/types";
import { buildMapsEmbedUrl } from "@/lib/maps/config";

export function LocationPreviewCard({
  title = "Location preview",
  description = "Resolved address and map context for this case.",
  location,
  compact = false,
}: {
  title?: string;
  description?: string;
  location?: CaseLocationMeta | null;
  compact?: boolean;
}) {
  const embedUrl = buildMapsEmbedUrl(location);
  const resolvedAddress = location?.formattedAddress || location?.locationText;
  const googleMapsHref =
    location && typeof location.lat === "number" && typeof location.lng === "number"
      ? `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`
      : location
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            location.formattedAddress || location.locationText
          )}`
        : null;

  return (
    <section className="surface-panel overflow-hidden p-0">
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
          {title}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div className={compact ? "aspect-[16/9] min-h-56 w-full" : "aspect-[4/3] min-h-64 w-full"}>
        {embedUrl ? (
          <iframe
            title={title}
            src={embedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(213,229,255,0.95),rgba(241,245,249,0.92)_50%,rgba(226,232,240,0.9))] px-6 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/80 text-primary shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <MapPin className="size-5" />
              </div>
              <p className="font-semibold text-foreground">
                {location?.locationText || "Location preview unavailable"}
              </p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable embedded map previews in this card.
              </p>
            </div>
          </div>
        )}
      </div>

      {location ? (
        compact ? (
          <div className="space-y-4 border-t border-border/60 p-5 sm:p-6">
            <div className="rounded-[22px] bg-muted/55 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{resolvedAddress}</p>
                  {location.nearbyLandmark ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Nearby: {location.nearbyLandmark}
                    </p>
                  ) : null}
                </div>
              </div>
              {googleMapsHref ? (
                <Link
                  href={googleMapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Open in Google Maps
                  <ExternalLink className="size-4" />
                </Link>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {typeof location.lat === "number" && typeof location.lng === "number" ? (
                <div className="rounded-[20px] bg-muted/75 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Navigation className="size-4 text-primary" />
                    Coordinates
                  </div>
                  <p className="mt-2 break-words leading-6 text-muted-foreground">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
                </div>
              ) : null}
              {location.timezoneId ? (
                <div className="rounded-[20px] bg-muted/75 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <TimerReset className="size-4 text-primary" />
                    Time zone
                  </div>
                  <p className="mt-2 break-words leading-6 text-muted-foreground">{location.timezoneId}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 border-t border-border/60 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(12rem,14rem)]">
            <div className="min-w-0 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{resolvedAddress}</p>
                  {location.nearbyLandmark ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Nearby: {location.nearbyLandmark}
                    </p>
                  ) : null}
                </div>
              </div>
              {googleMapsHref ? (
                <Link
                  href={googleMapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Open in Google Maps
                  <ExternalLink className="size-4" />
                </Link>
              ) : null}
            </div>
            <div className="grid gap-3 xl:justify-self-end xl:text-right">
              {typeof location.lat === "number" && typeof location.lng === "number" ? (
                <div className="rounded-[20px] bg-muted/75 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-foreground xl:justify-end">
                    <Navigation className="size-4 text-primary" />
                    Coordinates
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
                </div>
              ) : null}
              {location.timezoneId ? (
                <div className="rounded-[20px] bg-muted/75 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-foreground xl:justify-end">
                    <TimerReset className="size-4 text-primary" />
                    Time zone
                  </div>
                  <p className="mt-2 text-muted-foreground">{location.timezoneId}</p>
                </div>
              ) : null}
            </div>
          </div>
        )
      ) : null}
    </section>
  );
}
