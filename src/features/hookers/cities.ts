/** Справочник городов. Такой же список держит API (api/src/config.ts, cities). */
export const CITIES = ['Москва', 'Химки', 'Одинцово', 'Люберцы', 'Красногорск'] as const

export type City = (typeof CITIES)[number]
