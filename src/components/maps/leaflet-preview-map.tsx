"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

import type { CaseLocationMeta } from "@/lib/types";

function createMarkerIcon() {
  return {
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
    iconSize: [22, 22] as [number, number],
    iconAnchor: [11, 11] as [number, number],
  };
}

export function LeafletPreviewMap({
  location,
  className = "h-full w-full",
}: {
  location?: CaseLocationMeta | null;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current || !location) return;

    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || instanceRef.current) return;

      const lat = location.lat ?? 3.139;
      const lng = location.lng ?? 101.6869;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], location.mapZoom || 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.marker([lat, lng], {
        icon: L.divIcon(createMarkerIcon()),
      }).addTo(map);

      instanceRef.current = map;
    });

    return () => {
      cancelled = true;
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, [location]);

  useEffect(() => {
    if (!instanceRef.current || !location) return;

    const lat = location.lat ?? 3.139;
    const lng = location.lng ?? 101.6869;
    instanceRef.current.setView([lat, lng], location.mapZoom || 14);
  }, [location]);

  return <div ref={mapRef} className={className} />;
}
