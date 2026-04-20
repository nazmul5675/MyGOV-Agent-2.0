import type { CaseLocationMeta } from "@/lib/types";

export function buildOpenStreetMapHref(location?: CaseLocationMeta | null) {
  if (!location) return null;

  if (typeof location.lat === "number" && typeof location.lng === "number") {
    return `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=${location.mapZoom || 15}/${location.lat}/${location.lng}`;
  }

  const query = encodeURIComponent(location.formattedAddress || location.locationText);
  return `https://www.openstreetmap.org/search?query=${query}`;
}

export type NominatimResult = {
  display_name?: string;
  lat: string;
  lon: string;
  place_id?: number;
};

export async function searchLocations(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(trimmed)}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to search for that location right now.");
  }

  return (await response.json()) as NominatimResult[];
}

export async function reverseGeocodeLocation(lat: number, lng: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to resolve that map position right now.");
  }

  const result = (await response.json()) as {
    display_name?: string;
    place_id?: number;
  };

  return result;
}
