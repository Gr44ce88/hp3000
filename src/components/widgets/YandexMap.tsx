import { useEffect, useRef, useState } from 'react'
import { env } from '@/lib/env'
import { coordsFor } from '@/features/hookers/coords'
import { cn } from '@/lib/cn'

export type HeatPoint = { district: string; city: string; count: number }

export type YandexMapProps = {
  points: HeatPoint[]
  /** Порог «много анкет» — от него зависит цвет и радиус пятна. */
  hot: number
  warm: number
  onPick?: (district: string) => void
  className?: string
}

const API_URL = 'https://api-maps.yandex.ru/2.1/'
let loader: Promise<Window['ymaps']> | null = null

/** Скрипт API грузится один раз на всё приложение. */
function loadYmaps(): Promise<Window['ymaps']> {
  if (window.ymaps) return Promise.resolve(window.ymaps)
  if (loader) return loader

  loader = new Promise<Window['ymaps']>((resolve, reject) => {
    const params = new URLSearchParams({ lang: 'ru_RU' })
    if (env.yandexMapsKey) params.set('apikey', env.yandexMapsKey)

    const script = document.createElement('script')
    script.src = `${API_URL}?${params.toString()}`
    script.async = true
    script.onload = () => {
      if (window.ymaps) window.ymaps.ready(() => resolve(window.ymaps))
      else reject(new Error('ymaps не появился после загрузки'))
    }
    script.onerror = () => reject(new Error('не удалось загрузить API Яндекс.Карт'))
    document.head.append(script)
  }).catch((error: unknown) => {
    loader = null
    throw error
  })

  return loader
}

const P_RESET: Record<'hot' | 'warm' | 'few', string> = {
  hot: '#b4472b',
  warm: '#b98a2f',
  few: '#8a8f98',
}

/** Цвет пятна: красный — жарко, коричневый — средне, серый — пусто. */
const tone = (count: number, hot: number, warm: number) =>
  count >= hot ? P_RESET.hot : count >= warm ? P_RESET.warm : P_RESET.few

/**
 * Карта плотности: пятно на район, размер и цвет от числа анкет.
 * Без ключа API карта всё равно рисуется — ключ убирает ограничения тарифа.
 */
export function YandexMap({ points, hot, warm, onPick, className }: YandexMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('@/types/ymaps').YMap | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    loadYmaps()
      .then((ymaps) => {
        if (cancelled || !ymaps || !containerRef.current) return
        const map = new ymaps.Map(containerRef.current, {
          center: [55.751_244, 37.618_423],
          zoom: 10,
          controls: ['zoomControl', 'geolocationControl'],
        })
        mapRef.current = map
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      mapRef.current?.destroy()
      mapRef.current = null
    }
  }, [])

  // Точки перерисовываются при изменении статистики, сама карта живёт между рендерами.
  useEffect(() => {
    const map = mapRef.current
    const ymaps = window.ymaps
    if (status !== 'ready' || !map || !ymaps) return

    map.geoObjects.removeAll()

    for (const point of points) {
      const { coords } = coordsFor(point.district, point.city)
      const color = tone(point.count, hot, warm)
      const radius = 320 + point.count * 260

      const circle = new ymaps.Circle(
        [coords, radius],
        {
          hintContent: `${point.district}: ${point.count}`,
          balloonContent: `<strong>${point.district}</strong><br>${point.city}<br>анкет: ${point.count}`,
        },
        {
          fillColor: color,
          strokeColor: color,
          fillOpacity: 0.42,
          strokeOpacity: 0.6,
          strokeWidth: 1,
          interactivityModel: 'default#opaque',
        },
      )
      if (onPick) circle.events.add('click', () => onPick(point.district))
      map.geoObjects.add(circle)

      const label = new ymaps.Placemark(
        coords,
        { hintContent: `${point.district}: ${point.count}`, iconContent: String(point.count) },
        { preset: 'islands#darkBlueStretchyIcon' },
      )
      if (onPick) label.events.add('click', () => onPick(point.district))
      map.geoObjects.add(label)
    }
  }, [points, hot, warm, onPick, status])

  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-mat ring-1 ring-hairline', className)}>
      <div ref={containerRef} className="h-[320px] w-full sm:h-[380px]" />

      {status === 'loading' && (
        <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-content-muted">
          Загружаем карту…
        </p>
      )}

      {status === 'error' && (
        <p className="absolute inset-x-0 top-1/2 px-4 -translate-y-1/2 text-center text-xs text-content-muted">
          Карта не загрузилась. Проверь сеть и `VITE_YANDEX_MAPS_KEY` — без ключа Яндекс может
          ограничивать запросы.
        </p>
      )}
    </div>
  )
}
