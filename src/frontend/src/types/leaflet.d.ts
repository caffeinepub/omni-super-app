declare module "leaflet" {
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  interface LatLng {
    lat: number;
    lng: number;
  }
  interface Map {
    setView(center: LatLngLiteral | [number, number], zoom: number): this;
    remove(): void;
    on(event: string, handler: (...args: any[]) => void): this;
    off(event: string, handler?: (...args: any[]) => void): this;
    panTo(latlng: LatLngLiteral | [number, number]): this;
    flyTo(latlng: LatLngLiteral | [number, number], zoom?: number): this;
    getCenter(): LatLng;
    getZoom(): number;
  }
  interface Marker {
    addTo(map: Map): this;
    remove(): void;
    setLatLng(latlng: LatLngLiteral | [number, number]): this;
    getLatLng(): LatLng;
    bindPopup(content: string): this;
  }
  interface TileLayer {
    addTo(map: Map): this;
  }
  interface Icon {}
  interface DivIcon {}
  interface IconOptions {
    iconUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
    className?: string;
    html?: string;
  }
  function map(element: HTMLElement | string, options?: any): Map;
  function tileLayer(url: string, options?: any): TileLayer;
  function marker(
    latlng: LatLngLiteral | [number, number],
    options?: any,
  ): Marker;
  function icon(options: IconOptions): Icon;
  function divIcon(options: IconOptions): DivIcon;
  const Icon: { Default: { prototype: any; mergeOptions(options: any): void } };
  export default { map, tileLayer, marker, icon, divIcon, Icon };
  export { map, tileLayer, marker, icon, divIcon, type Icon };
  export type { Map, Marker, TileLayer, LatLng, LatLngLiteral };
}

declare module "leaflet/dist/leaflet.css" {}
