declare global {
  namespace google.maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface MapOptions {
      center: LatLngLiteral;
      zoom: number;
      mapTypeControl?: boolean;
      fullscreenControl?: boolean;
      streetViewControl?: boolean;
      clickableIcons?: boolean;
      gestureHandling?: string;
    }

    class Map {
      constructor(element: Element, options: MapOptions);
      addListener(eventName: string, handler: (event: MapMouseEvent) => void): void;
      panTo(position: LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number | undefined;
    }

    interface MarkerOptions {
      position: LatLngLiteral;
      map: Map;
      draggable?: boolean;
    }

    class Marker {
      constructor(options: MarkerOptions);
      addListener(eventName: string, handler: () => void): void;
      setPosition(position: LatLngLiteral): void;
      getPosition(): LatLng | null;
    }

    interface MapMouseEvent {
      latLng?: LatLng | null;
    }

    interface GeocoderRequest {
      location: LatLngLiteral;
    }

    interface GeocoderResult {
      formatted_address?: string;
      place_id?: string;
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null) => void
      ): void;
    }

    namespace places {
      interface PlaceResult {
        formatted_address?: string;
        name?: string;
        place_id?: string;
        geometry?: {
          location?: LatLng;
        };
      }

      interface AutocompleteOptions {
        componentRestrictions?: {
          country: string;
        };
        fields?: string[];
      }

      class Autocomplete {
        constructor(inputField: HTMLInputElement, options?: AutocompleteOptions);
        addListener(eventName: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }
    }
  }

  interface GoogleMapsGlobal {
    maps: typeof google.maps;
  }

  interface Window {
    google?: GoogleMapsGlobal;
    __mygovGoogleMapsLoader__?: Promise<GoogleMapsGlobal>;
  }
}

export {};
