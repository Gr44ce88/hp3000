/** Минимальные типы Yandex Maps JS API 2.1 — только то, что реально используем. */

export type YMaps = {
  ready: (callback: () => void) => void
  Map: new (
    element: HTMLElement,
    options: { center: [number, number]; zoom: number; controls?: string[] },
  ) => YMap
  Circle: new (
    geometry: [[number, number], number],
    properties: { hintContent?: string; balloonContent?: string },
    options: {
      fillColor: string
      strokeColor: string
      fillOpacity?: number
      strokeOpacity?: number
      strokeWidth?: number
      interactivityModel?: string
    },
  ) => YGeoObject
  Placemark: new (
    geometry: [number, number],
    properties: { hintContent?: string; iconContent?: string },
    options?: { preset?: string; iconColor?: string },
  ) => YGeoObject
}

export type YGeoObject = {
  events: { add: (name: string, handler: () => void) => void }
}

export type YMap = {
  geoObjects: { add: (object: YGeoObject) => void; removeAll: () => void }
  setCenter: (center: [number, number], zoom?: number, options?: { duration?: number }) => void
  destroy: () => void
}

declare global {
  interface Window {
    ymaps?: YMaps
  }
}
