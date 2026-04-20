"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPinned, Search, TriangleAlert } from "lucide-react";

import type { CaseLocationMeta } from "@/lib/types";
import { useGoogleMaps } from "@/hooks/use-google-maps";
import { Input } from "@/components/ui/input";

export function LocationPickerCard({
  apiKey,
  value,
  onChange,
}: {
  apiKey?: string;
  value?: CaseLocationMeta | null;
  onChange: (next: CaseLocationMeta) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [query, setQuery] = useState(
    value?.formattedAddress || value?.locationText || ""
  );
  const { isReady, status } = useGoogleMaps(apiKey);

  const fallbackCenter = useMemo(
    () => ({
      lat: value?.lat ?? 3.139,
      lng: value?.lng ?? 101.6869,
    }),
    [value?.lat, value?.lng]
  );

  useEffect(() => {
    if (!isReady || !mapRef.current || mapInstanceRef.current) return;

    const map = new window.google!.maps.Map(mapRef.current, {
      center: fallbackCenter,
      zoom: value?.mapZoom || 13,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      clickableIcons: false,
      gestureHandling: "cooperative",
    });

    const marker = new window.google!.maps.Marker({
      position: fallbackCenter,
      map,
      draggable: true,
    });

    const geocoder = new window.google!.maps.Geocoder();

    map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      marker.setPosition({ lat, lng });
      void geocoder.geocode(
        { location: { lat, lng } },
        (results: google.maps.GeocoderResult[] | null) => {
          const topResult = results?.[0];
          onChange({
            locationText:
              topResult?.formatted_address ||
              `Pinned location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            formattedAddress: topResult?.formatted_address,
            placeId: topResult?.place_id,
            lat,
            lng,
            timezoneId: "Asia/Kuala_Lumpur",
            mapZoom: map.getZoom() || 14,
          });
          setQuery(topResult?.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      );
    });

    marker.addListener("dragend", () => {
      const position = marker.getPosition();
      if (!position) return;
      const lat = position.lat();
      const lng = position.lng();
      void geocoder.geocode(
        { location: { lat, lng } },
        (results: google.maps.GeocoderResult[] | null) => {
          const topResult = results?.[0];
          onChange({
            locationText:
              topResult?.formatted_address ||
              `Pinned location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            formattedAddress: topResult?.formatted_address,
            placeId: topResult?.place_id,
            lat,
            lng,
            timezoneId: "Asia/Kuala_Lumpur",
            mapZoom: map.getZoom() || 14,
          });
          setQuery(topResult?.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      );
    });

    if (inputRef.current) {
      const autocomplete = new window.google!.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "my" },
        fields: ["formatted_address", "geometry", "place_id", "name"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const location = place.geometry?.location;
        if (!location) return;
        const lat = location.lat();
        const lng = location.lng();
        map.panTo({ lat, lng });
        map.setZoom(15);
        marker.setPosition({ lat, lng });
        const formattedAddress = place.formatted_address || place.name || query;
        setQuery(formattedAddress);
        onChange({
          locationText: formattedAddress,
          formattedAddress,
          placeId: place.place_id,
          lat,
          lng,
          timezoneId: "Asia/Kuala_Lumpur",
          mapZoom: 15,
        });
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;
  }, [fallbackCenter, isReady, onChange, query, value?.mapZoom]);

  useEffect(() => {
    if (!isReady || !mapInstanceRef.current || !markerRef.current || !value) return;
    const lat = value.lat ?? fallbackCenter.lat;
    const lng = value.lng ?? fallbackCenter.lng;
    mapInstanceRef.current.panTo({ lat, lng });
    markerRef.current.setPosition({ lat, lng });
    mapInstanceRef.current.setZoom(value.mapZoom || 15);
    setQuery(value.formattedAddress || value.locationText || "");
  }, [fallbackCenter.lat, fallbackCenter.lng, isReady, value]);

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
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a place, road, landmark, or address"
            className="h-12 rounded-full pl-11"
          />
        </div>
      </div>

      <div className="aspect-[4/3] w-full bg-muted/50">
        {!apiKey ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/80 text-primary shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <MapPinned className="size-5" />
              </div>
              <p className="font-semibold text-foreground">Maps key not configured</p>
              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable place
                search, pin selection, and embedded map previews.
              </p>
            </div>
          </div>
        ) : status === "error" ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#fff1ed] text-[#9a3b2f]">
                <TriangleAlert className="size-5" />
              </div>
              <p className="font-semibold text-foreground">Map failed to load</p>
              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                Check that the Maps JavaScript API and Places API are enabled for the current web origin.
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
                A fixed-size map canvas keeps the form stable while the location tools load.
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
