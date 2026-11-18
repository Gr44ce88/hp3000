/** Типизированный доступ к переменным окружения Vite. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  yandexMapsKey: import.meta.env.VITE_YANDEX_MAPS_KEY ?? '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
