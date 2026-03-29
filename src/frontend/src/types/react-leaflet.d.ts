declare module "react-leaflet" {
  import type { ComponentType } from "react";

  export const MapContainer: ComponentType<{
    center: [number, number];
    zoom: number;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
  export const TileLayer: ComponentType<{
    url: string;
    attribution?: string;
    [key: string]: unknown;
  }>;
  export const Marker: ComponentType<{
    position: [number, number];
    icon?: unknown;
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
  export const Popup: ComponentType<{
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
  export const Circle: ComponentType<{
    center: [number, number];
    radius: number;
    [key: string]: unknown;
  }>;
  export const Polyline: ComponentType<{
    positions: [number, number][];
    [key: string]: unknown;
  }>;
  export function useMap(): {
    setView(center: [number, number], zoom: number): unknown;
    panTo(latlng: [number, number]): unknown;
    flyTo(latlng: [number, number], zoom?: number): unknown;
    getCenter(): { lat: number; lng: number };
    getZoom(): number;
    remove(): void;
    fitBounds(bounds: unknown, options?: unknown): unknown;
    addLayer(layer: unknown): unknown;
    removeLayer(layer: unknown): unknown;
  };
  export function useMapEvents(
    handlers: Record<string, (...args: unknown[]) => void>,
  ): unknown;
}
