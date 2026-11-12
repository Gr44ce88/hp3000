# HookersPro3000

SPA-приложение на React. Каркас: Vite + TypeScript, роутинг, server-state, локальный стор, формы, темы, тесты.

## Стек

| Слой | Выбор |
| --- | --- |
| Сборка | Vite 8 |
| UI | React 19 + Tailwind CSS 4 |
| Роутинг | React Router 7 |
| Server state | TanStack Query 5 + Axios |
| Локальный state | Zustand 5 |
| Формы | React Hook Form + Zod |
| Тесты | Vitest + Testing Library + MSW |
| Линт/формат | Oxlint + Prettier |

## Команды

```bash
npm run dev            # dev-сервер на :5173, /api проксируется на VITE_PROXY_TARGET
npm run dev:api        # дев-мок на :8080 (in-memory, server/index.js)
npm run build          # tsc -b + vite build
npm run preview        # локальный предпросмотр сборки
npm run typecheck      # только типы
npm run lint           # oxlint
npm run format         # prettier
npm test               # тесты один прогон
npm run test:watch     # тесты в watch
npm run test:coverage  # покрытие (v8, html в coverage/)
```

## Структура

```
src/
  app/           роутер, layout
  components/    переиспользуемые UI-примитивы
  features/      доменные модули: api, types, компоненты, хуки
  hooks/         общие хуки
  lib/           утилиты, api-клиент, конфиг query-клиента
  pages/         экраны-страницы
  stores/        zustand-сторы
  test/          setup, msw-хендлеры, render-хелпер
  types/         общие типы
```

Правила, которые стоит держать:

- Импорты только через алиас `@/…`, относительные пути — в пределах одной папки.
- Данные с сервера — только через TanStack Query (`useQuery`/`useMutation`) и функции из `features/*/api.ts`; `useEffect` для загрузки не используем.
- Глобальное клиентское состояние — Zustand, локальное — `useState`.
- Всё, что ходит в сеть в тестах, заводится хендлером в `src/test/msw/server.ts`.

## Окружение

Скопируй `.env.example` в `.env` и поправь значения: `VITE_API_URL` (пусто = относительные запросы через прокси), `VITE_PROXY_TARGET`, `VITE_ENABLE_MSW`.

## Бэкенд

Реальный API — Rust (`api/`): axum + sqlx + Postgres, миграции, argon2, отзывы с защитой от дубля на уровне БД, избранное связью многие-ко-многим. Запуск и контракт — в `api/README.md`. Nginx-конфиг для продакшена — `deploy/nginx.conf`.

```bash
cd api && cargo run     # :8080, нужен DATABASE_URL в api/.env
```

Фронт уже переведён на сервер: избранное читается/пишется через `/api/favorites`, история просмотров остаётся в `localStorage` (`hp3k-history`).

## Что дальше

- Загрузка аватара и фото анкеты (сейчас — плейсхолдеры).
- Redis/очередь на письма, подтверждение e-mail.
- Тепловая карта: реальные данные вместо заглушки.
