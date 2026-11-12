/** Типизированный доступ к переменным окружения Vite. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  enableMocks: import.meta.env.VITE_ENABLE_MSW === 'true',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
