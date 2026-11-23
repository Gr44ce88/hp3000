import { distanceKm, stationById } from './metro.ts'

export type StationOffer = { id: string; count: number; minimum: number }
export type Alternatives = { nearby?: { id: string; count: number }; minimum?: number }

export function alternatives(
  selected: string,
  ceiling: number | undefined,
  offers: StationOffer[],
): Alternatives {
  const origin = stationById.get(selected)
  if (!origin) return {}
  const other = offers
    .flatMap((offer) => {
      const station = stationById.get(offer.id)
      if (!station || offer.id === selected || !offer.count) return []
      const km = distanceKm(origin, station)
      return km <= 5 ? [{ ...offer, km }] : []
    })
    .sort((a, b) => a.km - b.km || b.count - a.count)[0]
  const minimum = offers.find((offer) => offer.id === selected)?.minimum
  return {
    nearby: other && { id: other.id, count: other.count },
    minimum: ceiling && minimum && minimum > ceiling ? minimum : undefined,
  }
}
