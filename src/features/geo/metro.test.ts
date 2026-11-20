import { describe, expect, it } from 'vitest'
import { nearestStations, stations } from './metro'

describe('поиск станций вокруг дома', () => {
  it('считает от точки дома и ограничивает радиус', () => {
    const s = stations.find((s) => s.name === 'Тверская')!
    expect(nearestStations(s.lat, s.lon)[0]).toBe(s.id)
    expect(nearestStations(s.lat, s.lon)).toHaveLength(3)
    expect(nearestStations(56.4, 37)).toEqual([])
  })
  it('различает одноимённые станции по линии', () => {
    const matching = stations.filter((s) => s.name === 'Арбатская')
    expect(new Set(matching.map((s) => s.line)).size).toBe(2)
    expect(new Set(matching.map((s) => s.id)).size).toBe(2)
  })
})
