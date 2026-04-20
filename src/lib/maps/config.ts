import type { CaseLocationMeta } from "@/lib/types";

export function getGoogleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}

export function hasGoogleMapsApiKey() {
  return Boolean(getGoogleMapsApiKey());
}

function encodeQuery(value: string) {
  return encodeURIComponent(value);
}

export function buildMapsEmbedUrl(location?: CaseLocationMeta | null) {
  const key = getGoogleMapsApiKey();
  if (!key || !location) return null;

  const baseUrl = "https://www.google.com/maps/embed/v1";
  const zoom = String(location.mapZoom || 15);

  if (typeof location.lat === "number" && typeof location.lng === "number") {
    return `${baseUrl}/view?key=${key}&center=${location.lat},${location.lng}&zoom=${zoom}&maptype=roadmap&language=en&region=MY`;
  }

  const query = location.formattedAddress || location.locationText;
  return `${baseUrl}/place?key=${key}&q=${encodeQuery(query)}&zoom=${zoom}&maptype=roadmap&language=en&region=MY`;
}

export function buildStreetViewImageUrl(location?: CaseLocationMeta | null) {
  const key = getGoogleMapsApiKey();
  if (!key || !location) return null;

  const locationQuery =
    typeof location.lat === "number" && typeof location.lng === "number"
      ? `${location.lat},${location.lng}`
      : location.formattedAddress || location.locationText;

  return `https://maps.googleapis.com/maps/api/streetview?size=900x500&location=${encodeQuery(
    locationQuery
  )}&key=${key}`;
}
