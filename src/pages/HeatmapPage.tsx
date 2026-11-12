import { MapPlaceholder } from '@/components/widgets/MapPlaceholder'

export default function HeatmapPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-medium tracking-tight text-content">Тепловая карта</h1>
      <p className="mt-0.5 text-[11px] text-content-muted">
        Плотность анкет по районам. Пока заглушка — данные подключим позже.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <MapPlaceholder address="Москва" />
          <span className="absolute top-2 right-2 rounded-full bg-black/45 px-2 py-瘪 text-[11px] text-white backdrop-blur">
            слой плотности
          </span>
        </div>

        <aside className="space-y-3 rounded-lg bg-surface-elevated p-3 ring-1 ring-hairline">
          <p className="text-[11px] tracking-wide text-content-muted uppercase">Легенда</p>
          <ul className="space-y-2 text-xs text-content-muted">
            {[
              ['bg-danger', 'много анкет'],
              ['bg-rating', 'средне'],
              ['bg-line', 'мало'],
            ].map(([tone, label]) => (
              <li key={label} className="flex items-center gap-2">
                <span className={`size-3 rounded-sm ${tone}`} />
                {label}
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline pt-3 text-[11px] text-content-muted">
            Заглушка: реальный слой, зум и подсказки районов появятся после интеграции карт.
          </p>
        </aside>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {['Пресня', 'Хамовники', 'Басманный', 'Сити'].map((district) => (
          <div key={district} className="rounded-lg bg-mat p-3 ring-1 ring-hairline">
            <p className="text-xs font-medium text-content">{district}</p>
            <p className="mt-1 text-[11px] text-content-muted">— анкет</p>
          </div>
        ))}
      </div>
    </div>
  )
}
