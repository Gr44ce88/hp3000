import { FILTER_OPTIONS, SORT_OPTIONS, type SortKey, type FilterKey } from './sorting'
import type { HookerListParams } from './types'

const isFilterKey = (value: string): value is FilterKey =>
  FILTER_OPTIONS.some((option) => option.value === value)

const isSortKey = (value: string | null): value is SortKey =>
  SORT_OPTIONS.some((option) => option.value === value)

export function catalogFilters(params: URLSearchParams, favorites: string[]) {
  const query = params.get('q') ?? ''
  const city = params.get('city') ?? ''
  const metro = params.get('metro') ?? ''
  const district = params.get('district') ?? ''
  const service = params.get('service') ?? ''
  const minPrice = params.get('min') ?? ''
  const maxPrice = params.get('max') ?? ''
  const sortParam = params.get('sort')
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'price-asc'
  const filters = (params.get('f') ?? '').split(',').filter(isFilterKey)
  const onlyFavorites = filters.includes('favorites')
  const ceiling = Number(maxPrice) || undefined
  const request: HookerListParams = {
    q: query.trim() || undefined,
    city: city || undefined,
    district: district || undefined,
    metro: metro || undefined,
    service: service || undefined,
    sort,
    minPrice: Number(minPrice) || undefined,
    maxPrice: filters.includes('up-to-3000') ? Math.min(ceiling ?? 3000, 3000) : ceiling,
    hasPhoto: filters.includes('with-photo') || undefined,
    reviewed: filters.includes('reviewed') || undefined,
    center: filters.includes('center') || undefined,
    ids: onlyFavorites ? favorites : undefined,
  }
  return {
    request,
    query,
    city,
    district,
    metro,
    service,
    minPrice,
    maxPrice,
    sort,
    filters,
    onlyFavorites,
  }
}
