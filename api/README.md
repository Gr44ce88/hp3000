# API

HTTP-сервер проекта: Node + Express 5 + Postgres, TypeScript, запуск через `tsx`.

## Запуск

```bash
npm run db:start     # Postgres на :5433 (данные в D:\hermes\pgdata)
npm run db:migrate   # накатить миграции
npm run db:seed      # демо-аккаунт demo@hookers.local / demo12345 и шесть анкет
npm run dev:api      # API на :8080, watch
npm run api:smoke    # прогон контракта по всем ручкам
```

Фронт проксирует `/api` на `:8080` через Vite, поэтому отдельный CORS в дев-режиме не нужен.
`npm run db:reset` дропает схему и накатывает миграции заново.

## Переменные окружения

`.env` в корне проекта:

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | строка подключения к Postgres |
| `PORT` | порт API, по умолчанию 8080 |
| `SESSION_TTL_DAYS` | срок жизни сессии, по умолчанию 30 |
| `CORS_ORIGINS` | список источников для CORS через запятую |

## Устройство

```
api/
  migrations/     SQL-миграции, применяются по одной в транзакции
  src/app.ts      сборка express-приложения (без listen)
  src/server.ts   точка входа, graceful shutdown, чистка сессий
  src/routes/*    ручки: auth, hookers, favorites, health
  src/auth/*      argon2id, сессии в БД, middleware
  src/schemas.ts  zod-валидация входа
  src/views.ts    представление сущностей и агрегаты рейтинга
  src/db/*        пул, раннер миграций, сид
```

Решения, которые стоит держать в голове:

- Пароли — только argon2id (`@node-rs/argon2`), параметры OWASP-минимума.
- Сессии — opaque-токен; в БД лежит sha256 от него, срок жизни проверяется на каждом запросе.
- Один отзыв на анкету от одного автора — гарантирует уникальный индекс `(hooker_id, author_id)`, а не код.
- Рейтинг и число отзывов не денормализуются: считаются агрегатом по `reviews` в том же запросе.
- Просмотры пишутся на `GET /hookers/:id` для чужих анкет и только авторизованным.

## Контракт

Все ошибки — `{ message }` либо `{ message, errors: { поле: текст } }`: 401 без сессии, 403 на чужую анкету, 404 на отсутствующую, 409 на дубль e-mail или отзыва, 422 на валидацию.

| Метод и путь | Доступ | Что делает |
| --- | --- | --- |
| `GET /api/health` | все | состояние и счётчики |
| `POST /api/auth/register` | все | регистрация, 201 с токеном |
| `POST /api/auth/login` | все | вход по паролю |
| `POST /api/auth/demo` | все | сессия демо-аккаунта |
| `POST /api/auth/logout` | все | гасит текущую сессию |
| `GET /api/me` | сессия | текущий пользователь |
| `PATCH /api/me` | сессия | имя, e-mail, телефон |
| `GET /api/me/hookers` | сессия | свои анкеты |
| `GET /api/me/reviews` | сессия | свои отзывы |
| `GET /api/me/history` | сессия | просмотренные анкеты |
| `GET /api/hookers` | все | каталог: `q`, `city`, `ids`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` |
| `GET /api/hookers/:id` | все | анкета |
| `POST /api/hookers` | сессия | создать анкету |
| `PATCH /api/hookers/:id` | владелец | изменить |
| `DELETE /api/hookers/:id` | владелец | удалить |
| `GET /api/hookers/:id/reviews` | все | отзывы, `sort=new\|old\|best\|worst` |
| `POST /api/hookers/:id/reviews` | сессия | оставить отзыв |
| `GET /api/favorites` | сессия | `{ ids }` избранного |
| `PUT /api/favorites/:id` | сессия | добавить |
| `DELETE /api/favorites/:id` | сессия | убрать |
| `GET /api/stats/districts` | все | плотность по районам |
| `POST /api/uploads` | сессия | загрузка одного фото, отдаёт `/uploads/<файл>` |
| `POST /api/payments` | владелец | заявка на публикацию, отдаёт ссылку FreeKassa |
| `GET /api/payments/:hookerId` | владелец | статус последней заявки |
| `POST /api/payments/freekassa/notify` | FreeKassa | оповещение об оплате, отвечает `YES` |
| `POST /api/payments/:id/mock-paid` | владелец, не прод | локальное подтверждение без ключей |

## Фото и услуги

- Фото грузятся по одному через `POST /api/uploads` (multipart, поле `file`, JPEG/PNG/WebP до 2 МБ), файлы складываются в `public/uploads` и отдаются статикой с `/uploads`. В анкете максимум 6 фото.
- `mainPhoto` — главное фото, оно показывается в каталоге. Если не задано, берётся первое из `photos`.
- `services` — массив, интерфейс даёт несколько услуг чекбоксами из справочника `SERVICES` (общий с фронтом набор).
- Каталог фильтруется по услуге: `GET /api/hookers?service=GFE` (сравнение по `any(services)`).

## Оплата публикации

Анкета создаётся **неопубликованной** (`is_published = false`): в каталоге и в статистике её нет, по прямой ссылке её видит только владелец. В каталог её пускает оплата комиссии (`PUBLICATION_FEE`, по умолчанию 490 ₽).

Провайдер — FreeKassa SCI ([документация](https://docs.freekassa.net/)):

- Подпись формы: `md5("m:oa:secret1:currency:order")`, ссылка ведёт на `https://pay.fk.money/`.
- Подпись оповещения: `md5("MERCHANT_ID:AMOUNT:secret2:MERCHANT_ORDER_ID")`, ответ строго `YES`, иначе FreeKassa повторяет запрос.
- В кабинете FreeKassa (merchant) URL оповещения — `https://<домен>/api/payments/freekassa/notify`, метод POST, тестовый режим выключить после проверки.
- `FREEKASSA_CHECK_IP=true` в проде включает белый список IP провайдера.

Переменные: `FREEKASSA_MERCHANT_ID`, `FREEKASSA_SECRET_1`, `FREEKASSA_SECRET_2`, `FREEKASSA_CURRENCY`, `PUBLICATION_FEE`. Без ключей ручка отдаёт `paymentUrl: null` — анкета остаётся неоплаченной, сценарий можно прогнать кнопкой «Подтвердить тестом» (`mock-paid`).
