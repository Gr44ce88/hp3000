# hp3k

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
npm run dev:api        # API на :8080 (api/, tsx watch)
npm run db:start       # локальный Postgres на :5433
npm run db:migrate     # миграции
npm run db:seed        # демо-аккаунт и анкеты
npm run db:reset       # дроп схемы и миграции заново
npm run api:smoke      # проверка контракта API
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
api/             сервер: Express + Postgres, миграции, сид
scripts/         db.sh (кластер), api-smoke.sh (контракт)
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

Скопируй `.env.example` в `.env` и поправь значения: `VITE_API_URL` (пусто = относительные запросы через прокси), `VITE_PROXY_TARGET`, `VITE_YANDEX_MAPS_KEY`.

Сайт работает только на реальном API: мок-слой из рантайма убран, MSW остался лишь в тестах (`src/test/msw/server.ts`). Если API не поднят — экраны покажут ошибку загрузки, а не подставные данные.

## Локальная БД

Postgres 17 для разработки живёт **вне репозитория**: данные в `D:\hermes\pgdata`, бинари в `~/pgsql/bin`, порт 5433 (5432 занят системной службой). Строка подключения — `DATABASE_URL` в `.env`.

```bash
npm run db:start     # поднять кластер
npm run db:stop      # погасить
npm run db:psql      # psql в базу hookers
npm run db:clear     # удалить все данные, оставить схему (состояние «как после деплоя»)
```

Две грабли, на которые уже наступали:

- `pg_ctl start` на этой машине даёт падение бэкендов с `0xC0000142` при первом подключении, поэтому `scripts/db.sh` стартует `postgres` напрямую и с чистым `PATH` без `/usr/bin` от git-bash.
- Пути в аргументах нативных `postgres.exe`/`psql.exe` должны быть вида `D:/hermes/pgdata`, а не `/d/hermes/pgdata`: MSYS-трансляция здесь выключена.

## Бэкенд

Реальный API — `api/`: Express 5 + Postgres 17 на TypeScript, argon2id, сессии в БД, zod-валидация, SQL-миграции. Запуск, переменные окружения и полный контракт — в `api/README.md`. Nginx-конфиг для продакшена — `deploy/nginx.conf`.

```bash
npm run db:start && npm run db:migrate && npm run db:seed
npm run dev:api      # :8080
```

Избранное читается/пишется через `/api/favorites`, история просмотров дублируется на сервер (`/api/me/history`) и в `localStorage` (`hp3k-history`).

Публикация анкеты платная: анкета создаётся скрытой и попадает в каталог только после оплаты комиссии через FreeKassa (`api/README.md`, раздел «Оплата публикации»).

## Деплой

Сервер: Ubuntu 22.04, приложение в `/srv/hp3000`, systemd-юнит `hp3k-api` (автозапуск, рестарт при падении), nginx проксирует `/api` на `127.0.0.1:8080` и отдаёт `dist`. Порядок:

```bash
tar -czf - --exclude=node_modules --exclude=.git --exclude=dist --exclude=.env --exclude=public/uploads . \
  | ssh -i ~/.ssh/hp3000_ed25519 -p 1270 futile@104.143.218.6 'tar -xzf - -C /srv/hp3000'
ssh hp3000 'cd /srv/hp3000 && npm ci && npm run db:migrate && npm run build && sudo systemctl restart hp3k-api'
ssh hp3000 'bash /srv/hp3000/scripts/api-smoke.sh http://127.0.0.1:8080/api'
```

Перед первым боевым деплоем нужен `pg_dump`, HTTPS — после появления домена (`certbot --nginx`).

## Карты

Карта (`/heatmap`) — Яндекс.Карты JS API 2.1: пятна рисуются по районам из `/api/stats/districts`, размер и цвет зависят от плотности, клик по пятну открывает каталог с фильтром по району.

- Ключ — `VITE_YANDEX_MAPS_KEY` в `.env` ([кабинет разработчика](https://developer.tech.yandex.ru/services)). Пустое значение тоже работает, но с лимитами тарифа и без гарантий.
- Координаты районов и городов — `src/features/hookers/coords.ts`. Новый район без координат ставится по центру города, так что карта не ломается.
- Скрипт API грузится один раз на приложение (`src/components/widgets/YandexMap.tsx`), при ошибке загрузки показывается текст вместо карты.

## Что дальше

- Загрузка аватара и фото анкеты (сейчас — плейсхолдеры).
- Redis/очередь на письма, подтверждение e-mail.
- Реальные координаты анкет вместо справочника районов.
