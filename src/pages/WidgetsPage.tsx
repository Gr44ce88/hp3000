import { useState } from 'react'
import { HookerCard } from '@/components/widgets/HookerCard'
import { MapPlaceholder } from '@/components/widgets/MapPlaceholder'
import { ProfileChip } from '@/components/widgets/ProfileChip'
import { ReviewCard } from '@/components/widgets/ReviewCard'
import { SortFilterBar } from '@/components/widgets/SortFilterBar'
import type { FilterKey, SortKey } from '@/features/hookers/sorting'

const demo = [
  { name: 'Аня', age: 24, city: 'Москва', pricePerHour: 5000, height: 170, rating: 4.8, reviewsCount: 12 },
  { name: 'Милана', age: 27, city: 'Москва', pricePerHour: 3500, height: 176, rating: 4.5, reviewsCount: 4 },
  { name: 'Кира', age: 22, city: 'Химки', pricePerHour: 2800, height: 165, rating: 5, reviewsCount: 27 },
  { name: 'Ева', age: 31, city: 'Москва', pricePerHour: 9000, height: 168, rating: 4.2, reviewsCount: 2 },
]

export default function WidgetsPage() {
  const [sort, setSort] = useState<SortKey>('price-asc')
  const [filters, setFilters] = useState<FilterKey[]>(['with-photo'])

  const toggleFilter = (filter: FilterKey) =>
    setFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    )

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header>
        <h1 className="text-xl font-medium tracking-tight text-content">Виджеты</h1>
        <p className="mt-2 text-sm text-content-muted">
          Галерея компонентов на заглушках данных. Всё ниже — рабочие элементы, но без привязки к API.
        </p>
      </header>

      <Section title="Карточка анкеты — альбомная" hint="Во всю ширину контейнера">
        <HookerCard {...demo[0]!} href="/hookers/1" services="Классика, GFE, массаж" />
      </Section>

      <Section title="Карточка анкеты — книжная" hint="Каждая занимает 1/4 ширины контейнера">
        <div className="flex gap-3">
          {demo.map((item, index) => (
            <HookerCard
              key={item.name}
              {...item}
              orientation="portrait"
              width="quarter"
              href={`/hookers/${index + 1}`}
            />
          ))}
        </div>
      </Section>

      <Section title="Профили" hint="Наведите на аватар — список зависит от варианта">
        <div className="flex flex-wrap items-center gap-6">
          <ProfileChip variant="own" name="Аня" />
          <ProfileChip variant="foreign" name="Милана" reviewsCount={4} registeredAt="2024-03-12" />
          <ProfileChip variant="anonymous" />
        </div>
      </Section>

      <Section title="Отзыв" hint="Имя, оценка 1–5, текст">
        <div className="max-w-xl space-y-3">
          <ReviewCard
            author="Дмитрий"
            rating={5}
            createdAt="2026-10-02"
            text="Всё точно по анкете, без сюрпризов. Договорились за час, приехала вовремя, общение лёгкое."
          />
          <ReviewCard
            author="Максим"
            rating={3}
            createdAt="2026-09-18"
            text="Фото старые, в жизни иначе. В целом нормально, но ожидал другого."
          />
        </div>
      </Section>

      <Section title="Карта" hint="Пока картинка-заглушка">
        <MapPlaceholder address="Москва, Пресненская наб., 12" className="max-w-2xl" />
      </Section>

      <Section title="Сортировка и фильтры" hint="Кнопки, состояние локальное">
        <SortFilterBar
          sort={sort}
          onSortChange={setSort}
          activeFilters={filters}
          onToggleFilter={toggleFilter}
          onReset={() => setFilters([])}
          resultCount={filters.length > 0 ? 3 : demo.length}
        />
        <p className="mt-3 font-mono text-xs text-content-muted">
          sort={sort} filters=[{filters.join(', ')}]
        </p>
      </Section>
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2">
        <h2 className="text-[11px] font-medium tracking-wide text-content-muted uppercase">{title}</h2>
        {hint && <p className="text-xs text-content-muted">{hint}</p>}
      </div>
      {children}
    </section>
  )
}
