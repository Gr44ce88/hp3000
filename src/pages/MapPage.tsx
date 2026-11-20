import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Flame, MapPinOff } from 'lucide-react'
import { YandexMap } from '@/components/widgets/YandexMap'
import { Spinner } from '@/components/ui/Spinner'
import { fetchDistrictStats } from '@/features/hookers/api'

/** Порог тона: сколько анкет в районе считается «много». */
const HOT = 3
const WARM = 2

export default function MapPage() {
  const navigate = useNavigate()
  const stats = useQuery({
    queryKey: ['stats', 'districts'],
    queryFn: ({ signal }) => fetchDistrictStats(signal),
    staleTime: 60_000,
  })

  const items = stats.data ?? []
  const busiest = items[0]

  const pick = useCallback((district: string, city: string) => {
    navigate(`/?${new URLSearchParams({ city, district })}`)
  }, [navigate])

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="flex items-center gap-2 text-xl font-medium tracking-tight text-content">
        <Flame className="size-5 text-brand-600" aria-hidden="true" />
        Карта
      </h1>
      <p className="mt-0.5 text-[11px] text-content-muted">
        Выберите район на карте или в списке, чтобы открыть его анкеты.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <YandexMap points={items} hot={HOT} warm={WARM} onPick={pick} />

        </div>

        <aside className="space-y-3 rounded-lg bg-surface-elevated p-3 ring-1 ring-hairline">
          <p className="text-[11px] tracking-wide text-content-muted uppercase">Легенда</p>
          <ul className="space-y-2 text-xs text-content-muted">
            {[
              ['bg-danger', `много анкет (${HOT}+)`],
              ['bg-rating', `${WARM} анкеты`],
              ['bg-line', 'мало'],
            ].map(([tone, label]) => (
              <li key={label} className="flex items-center gap-2">
                <span className={`size-3 rounded-sm ${tone}`} />
                {label}
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline pt-3 text-[11px] text-content-muted">
            Точки ставятся по району; если района нет в справочнике координат — по центру города.
          </p>
        </aside>
      </div>

      {stats.isPending && (
        <div className="mt-6">
          <Spinner label="Считаем районы" />
        </div>
      )}

      {stats.isError && (
        <p className="mt-6 text-xs text-content-muted">Не удалось получить статистику по районам.</p>
      )}

      {stats.isSuccess && (
        <>
          <p className="mt-6 text-[11px] tracking-wide text-content-muted uppercase">
            Районы по плотности{busiest ? ` · максимум: ${busiest.district}` : ''}
          </p>
          {items.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 rounded-lg bg-mat p-4 text-xs text-content-muted ring-1 ring-dashed ring-hairline">
              <MapPinOff className="size-4 shrink-0" aria-hidden="true" />
              Пока ни одной анкеты с районом.
            </p>
          ) : (
            <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <li key={item.city + item.district}><button type="button" onClick={() => pick(item.district, item.city)} className="district-tile">
                  <span
                    aria-hidden="true"
                    className={`mb-2 block h-1 rounded-full ${
                      item.count >= HOT ? 'bg-danger' : item.count >= WARM ? 'bg-rating' : 'bg-line'
                    }`}
                  />
                  <p className="text-base font-medium text-content">{item.district}</p><p className="text-xs text-content-muted">{item.city}</p>
                  <p className="mt-1 text-[11px] text-content-muted tabular-nums">
                    {item.count} {item.count === 1 ? 'анкета' : 'анкет'}
                  </p>
                </button></li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
