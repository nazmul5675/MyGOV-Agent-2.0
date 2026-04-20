"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, LoaderCircle, MapPinned, Search, TriangleAlert } from "lucide-react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

import type { CaseLocationMeta } from "@/lib/types";
import { reverseGeocodeLocation, searchLocations } from "@/lib/maps/leaflet";
import { Input } from "@/components/ui/input";

export function LocationPickerCard({
  value,
  onChange,
}: {
  value?: CaseLocationMeta | null;
  onChange: (next: CaseLocationMeta) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [query, setQuery] = useState(
    value?.formattedAddress || value?.locationText || ""
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ label: string; lat: number; lng: number; placeId?: string }>
  >([]);
  const activeQuery = query.trim();
  const selectedLabel = (value?.formattedAddress || value?.locationText || "").trim();

  const fallbackCenter = useMemo(
    () => ({
      lat: value?.lat ?? 3.139,
      lng: value?.lng ?? 101.6869,
    }),
    [value?.lat, value?.lng]
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    void import("leaflet")
      .then((L) => {
        if (cancelled || !mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: false,
        }).setView([fallbackCenter.lat, fallbackCenter.lng], value?.mapZoom || 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const marker = L.marker([fallbackCenter.lat, fallbackCenter.lng], {
          draggable: true,
          icon: L.divIcon({
            html: `
              <span style="
                display:flex;
                align-items:center;
                justify-content:center;
                width:22px;
                height:22px;
                border-radius:9999px;
                background:#001e40;
                border:3px solid rgba(255,255,255,0.95);
                box-shadow:0 10px 24px rgba(0,30,64,0.22);
              "></span>
            `,
            className: "leaflet-map-marker",
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        }).addTo(map);

        const updateFromPoint = async (lat: number, lng: number) => {
          try {
            const result = await reverseGeocodeLocation(lat, lng);
            const formattedAddress =
              result.display_name || `Pinned location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
            setQuery(formattedAddress);
            onChange({
              locationText: formattedAddress,
              formattedAddress,
              placeId: result.place_id ? String(result.place_id) : undefined,
              lat,
              lng,
              timezoneId: "Asia/Kuala_Lumpur",
              mapZoom: map.getZoom() || 14,
            });
          } catch {
            const fallbackLabel = `Pinned location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
            setQuery(fallbackLabel);
            onChange({
              locationText: fallbackLabel,
              formattedAddress: fallbackLabel,
              lat,
              lng,
              timezoneId: "Asia/Kuala_Lumpur",
              mapZoom: map.getZoom() || 14,
            });
          }
        };

        map.on("click", (event) => {
          const lat = event.latlng.lat;
          const lng = event.latlng.lng;
          marker.setLatLng([lat, lng]);
          void updateFromPoint(lat, lng);
        });

        marker.on("dragend", () => {
          const position = marker.getLatLng();
          void updateFromPoint(position.lat, position.lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setStatus("ready");
      })
      .catch(() => setStatus("error"));

    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [fallbackCenter.lat, fallbackCenter.lng, onChange, value?.mapZoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !value) return;
    const lat = value.lat ?? fallbackCenter.lat;
    const lng = value.lng ?? fallbackCenter.lng;
    mapInstanceRef.current.setView([lat, lng], value.mapZoom || 15);
    markerRef.current.setLatLng([lat, lng]);
    setQuery(value.formattedAddress || value.locationText || "");
  }, [fallbackCenter.lat, fallbackCenter.lng, value]);

  useEffect(() => {
    if (!activeQuery || activeQuery === selectedLabel) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsSearching(true);
      void searchLocations(activeQuery)
        .then((results) => {
          setSearchResults(
            results.map((result) => ({
              label: result.display_name || `${result.lat}, ${result.lon}`,
              lat: Number(result.lat),
              lng: Number(result.lon),
              placeId: result.place_id ? String(result.place_id) : undefined,
            }))
          );
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeQuery, selectedLabel]);

  const handleSelectResult = (result: {
    label: string;
    lat: number;
    lng: number;
    placeId?: string;
  }) => {
    setQuery(result.label);
    setSearchResults([]);
    mapInstanceRef.current?.setView([result.lat, result.lng], 15);
    markerRef.current?.setLatLng([result.lat, result.lng]);
    onChange({
      locationText: result.label,
      formattedAddress: result.label,
      placeId: result.placeId,
      lat: result.lat,
      lng: result.lng,
      timezoneId: "Asia/Kuala_Lumpur",
      mapZoom: 15,
    });
  };

  return (
    <section className="surface-panel overflow-hidden p-0">
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
          Location intelligence
        </p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Search for an address or landmark, then fine-tune the pin on the map. The selected place is saved back into the case packet.
        </p>
      </div>

      <div className="border-y border-border/60 px-6 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchResults([]);
            }}
            placeholder="Search a place, road, landmark, or address"
            className="h-12 rounded-full pl-11"
          />
          {isSearching ? (
            <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
          {activeQuery && activeQuery !== selectedLabel && searchResults.length ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-10 rounded-[24px] border border-border/70 bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              {searchResults.map((result) => (
                <button
                  key={`${result.lat}-${result.lng}`}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="flex w-full rounded-[18px] px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  {result.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="aspect-[4/3] w-full bg-muted/50">
        {status === "error" ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#fff1ed] text-[#9a3b2f]">
                <TriangleAlert className="size-5" />
              </div>
              <p className="font-semibold text-foreground">Map failed to load</p>
              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                The Leaflet canvas could not load right now. Check the network connection and try again.
              </p>
            </div>
          </div>
        ) : status !== "ready" ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/80 text-primary shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <MapPinned className="size-5" />
              </div>
              <p className="font-semibold text-foreground">Preparing the map</p>
              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                A fixed-size Leaflet map canvas keeps the form stable while the location tools load.
              </p>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="h-full w-full" />
        )}
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <div className="rounded-[22px] bg-muted/75 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <LocateFixed className="size-4 text-primary" />
            Resolved address
          </div>
          <p className="mt-2 text-muted-foreground">
            {value?.formattedAddress || value?.locationText || "Select a place or pin a location on the map."}
          </p>
        </div>
        <div className="rounded-[22px] bg-muted/75 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <MapPinned className="size-4 text-primary" />
            Coordinates
          </div>
          <p className="mt-2 text-muted-foreground">
            {typeof value?.lat === "number" && typeof value?.lng === "number"
              ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
              : "Coordinates will appear after you choose a place or pin."}
          </p>
        </div>
      </div>
    </section>
  );
}
