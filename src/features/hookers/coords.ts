/** Координаты районов и городов, по которым раскладываются точки карты. */
export type Coords = [latitude: number, longitude: number]

/** Районы, которые встречаются в анкетах. */
export const DISTRICT_COORDS: Record<string, Coords> = {
  Пресня: [55.7601, 37.5603],
  Хамовники: [55.7315, 37.5734],
  Левобережный: [55.9028, 37.4676],
  Сити: [55.7494, 37.5399],
  Басманный: [55.7622, 37.6546],
  Центр: [55.7558, 37.6173],
  Таганский: [55.7421, 37.6536],
  Арбат: [55.7500, 37.5927],
  Тверской: [55.7649, 37.6051],
  Сокол: [55.8055, 37.5151],
  Черёмушки: [55.6851, 37.5714],
  Коньково: [55.6398, 37.5233],
}

/** Центры городов — запасной вариант, если район неизвестен. */
export const CITY_COORDS: Record<string, Coords> = {
  Москва: [55.7558, 37.6173],
  Химки: [55.8892, 37.4450],
  Одинцово: [55.6789, 37.2639],
  Люберцы: [55.6758, 37.8938],
  Красногорск: [55.8317, 37.3299],
}

/** Точка на карте: район или город, если района нет в справочнике. */
export function coordsFor(district: string, city: string): { coords: Coords; exact: boolean } {
  const districtCoords = DISTRICT_COORDS[district]
  if (districtCoords && city === 'Москва') return { coords: districtCoords, exact: true }
  const cityCoords = CITY_COORDS[city]
  if (cityCoords) return { coords: cityCoords, exact: false }
  return { coords: CITY_COORDS['Москва']!, exact: false }
}
