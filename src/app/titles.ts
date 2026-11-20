/** Заголовок вкладки по шаблону маршрута: динамические адреса не должны давать «не найдено». */
const titles: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/$/, 'Главная'],
  [/^\/hookers$/, 'Анкеты'],
  [/^\/hookers\/new$/, 'Новая анкета'],
  [/^\/hookers\/[^/]+\/edit$/, 'Редактирование анкеты'],
  [/^\/hookers\/[^/]+$/, 'Анкета'],
  [/^\/auth$/, 'Вход'],
  [/^\/profile$/, 'Мой профиль'],
  [/^\/profile\/edit$/, 'Редактирование профиля'],
  [/^\/widgets$/, 'Виджеты'],
  [/^\/favorites$/, 'Избранное'],
  [/^\/map$/, 'Карта'],
  [/^\/heatmap$/, 'Карта'],
]

export function titleFor(pathname: string): string | undefined {
  return titles.find(([pattern]) => pattern.test(pathname))?.[1]
}
