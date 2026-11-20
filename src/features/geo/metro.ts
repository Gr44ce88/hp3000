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

export function nearestStations(lat: number, lon: number): string[] {
  const rad = Math.PI / 180
  const ranked = stations.map((station) => {
    const h =
      Math.sin(((station.lat - lat) * rad) / 2) ** 2 +
      Math.cos(lat * rad) *
        Math.cos(station.lat * rad) *
        Math.sin(((station.lon - lon) * rad) / 2) ** 2
    return { id: station.id, km: 12742 * Math.asin(Math.sqrt(h)) }
  })
  return ranked
    .filter((s) => s.km <= 5)
    .sort((a, b) => a.km - b.km)
    .slice(0, 3)
    .map((s) => s.id)
}
