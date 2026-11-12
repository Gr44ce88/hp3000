export const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'age-asc', label: 'Моложе' },
  { value: 'rating-desc', label: 'По рейтингу' },
  { value: 'new-desc', label: 'Сначала новые' },
] as const

export const FILTER_OPTIONS = [
  { value: 'favorites', label: 'Избранное' },
  { value: 'with-photo', label: 'С фото' },
  { value: 'up-to-3000', label: 'До 3 000 ₽' },
  { value: 'reviewed', label: 'С отзывами' },
  { value: 'center', label: 'Центр' },
] as const

export type SortKey = (typeof SORT_OPTIONS)[number]['value']
export type FilterKey = (typeof FILTER_OPTIONS)[number]['value']
