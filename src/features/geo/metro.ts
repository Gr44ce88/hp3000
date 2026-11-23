// Справочник московского метро из https://api.hh.ru/metro/1, 20.11.2026.
import stations from './stations.json' with { type: 'json' }
export { stations }
export const stationById = new Map(stations.map((station) => [station.id, station]))
export type HouseAddress = {
  id: string
  city: string
  street: string
  house: string
  lat: number
  lon: number
  metroIds: string[]
}
export const addressLabel = (a: HouseAddress) => [a.city, a.street, a.house].join(', ')
export const metroLabel = (ids: string[]) =>
  ids
    .map((id) => stationById.get(id)?.name)
    .filter(Boolean)
    .join(' · ')

export function cardLocation(
  district: string | undefined,
  address: HouseAddress | null | undefined,
  selectedMetro = '',
) {
  const nearest = address?.metroIds[0]
  const station = nearest && !selectedMetro ? stationById.get(nearest) : undefined
  return [district, station && 'м. ' + station.name].filter(Boolean).join(' · ')
}

type Point = { lat: number; lon: number }
export function distanceKm(a: Point, b: Point) {
  const rad = Math.PI / 180
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) *
      Math.cos(b.lat * rad) *
      Math.sin(((b.lon - a.lon) * rad) / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function stationDistance(
  address: HouseAddress | null | undefined,
  stationId: string,
) {
  const station = stationById.get(stationId)
  if (!address || !station) return
  const km = distanceKm(address, station)
  const distance =
    km < 1
      ? Math.round(km * 1000) + ' м'
      : km.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' км'
  return `м. ${station.name} · ${distance} по прямой`
}

export function nearestStations(lat: number, lon: number): string[] {
  const ranked = stations.map((station) => ({
    id: station.id,
    km: distanceKm({ lat, lon }, station),
  }))
  return ranked
    .filter((s) => s.km <= 5)
    .sort((a, b) => a.km - b.km)
    .slice(0, 3)
    .map((s) => s.id)
}
