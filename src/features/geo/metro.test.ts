import { describe, expect, it } from 'vitest'
import { nearestStations, stationDistance, stations } from './metro'

describe('поиск станций вокруг дома', () => {
  it('считает от точки дома и ограничивает радиус', () => {
    const s = stations.find((s) => s.name === 'Тверская')!
    expect(nearestStations(s.lat, s.lon)[0]).toBe(s.id)
    expect(nearestStations(s.lat, s.lon)).toHaveLength(3)
    expect(nearestStations(56.4, 37)).toEqual([])
  })
  it('показывает расстояние до выбранной станции даже когда другая ближе', () => {
    const first = stations.find((s) => s.name === 'Пушкинская')!
    const selected = stations.find((s) => s.name === 'Тверская')!
    const address = {
      ...first,
      city: 'Москва',
      street: 'Тестовая',
      house: '1',
      metroIds: [first.id, selected.id],
    }
    expect(stationDistance(address, selected.id)).toMatch(
      /^м. Тверская · [1-9]\d* м по прямой$/,
    )
    expect(stationDistance(null, selected.id)).toBeUndefined()
  })
  it('различает одноимённые станции по линии', () => {
    const matching = stations.filter((s) => s.name === 'Арбатская')
    expect(new Set(matching.map((s) => s.line)).size).toBe(2)
    expect(new Set(matching.map((s) => s.id)).size).toBe(2)
  })
})
