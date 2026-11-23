import axios from 'axios'
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../auth/middleware.ts'
import { one } from '../db/pool.ts'
import { ApiError, badRequest } from '../http/errors.ts'
import { handle, parseBody } from '../http/respond.ts'
import { config } from '../config.ts'
import { nearestStations, type HouseAddress } from '../../../src/features/geo/metro.ts'

const inputSchema = z.object({
  city: z.enum(config.cities),
  street: z.string().trim().min(2).max(140),
  house: z.string().trim().min(1).max(24),
})
const feature = z.object({
  properties: z.object({
    type: z.literal('house'),
    countrycode: z.string(),
    city: z.string(),
    street: z.string().min(1),
    housenumber: z.string().min(1),
  }),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  }),
})
const norm = (s: string) => s.toLowerCase().replaceAll('ё', 'е').replace(/\s+/g, '')
export const addressColumns = `a.id, a.city, a.street, a.house, a.lat, a.lon, a.metro_ids as "metroIds"`
export const addressesRouter = Router()
addressesRouter.post(
  '/addresses/lookup',
  requireAuth,
  handle(async (req, res) => {
    const { city, street, house } = parseBody(inputSchema, req.body)
    let features: unknown[]
    try {
      const { data } = await axios.get(
        process.env.PHOTON_URL || 'https://photon.komoot.io/api/',
        {
          params: { q: [city, street, house].join(', '), limit: 8 },
          timeout: 10000,
        },
      )
      features = z.array(z.unknown()).parse(data.features)
    } catch {
      throw new ApiError(503, 'Сервис адресов временно недоступен. Попробуйте ещё раз.')
    }
    const items = new Map<string, HouseAddress>()
    for (const value of features) {
      const parsed = feature.safeParse(value)
      if (!parsed.success) continue
      const { properties: p, geometry } = parsed.data
      if (
        p.countrycode.toUpperCase() !== 'RU' ||
        norm(p.city) !== norm(city) ||
        norm(p.housenumber) !== norm(house)
      )
        continue
      const [lon, lat] = geometry.coordinates
      const row = await one<HouseAddress>(
        `insert into house_addresses as a (city,street,house,lat,lon,metro_ids)
      values ($1,$2,$3,$4,$5,$6) on conflict (city,street,house,lat,lon)
      do update set metro_ids = excluded.metro_ids returning ${addressColumns}`,
        [city, p.street, p.housenumber, lat, lon, nearestStations(lat, lon)],
      )
      if (row) items.set(row.id, row)
    }
    res.json({ items: [...items.values()] })
  }),
)

export async function verifyAddress(id: string | undefined, city: string) {
  if (
    !id ||
    !(await one('select id from house_addresses where id=$1 and city=$2', [id, city]))
  )
    throw badRequest('Выберите найденный дом в указанном городе.')
}
