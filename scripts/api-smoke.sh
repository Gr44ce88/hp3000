#!/usr/bin/env bash
# Смоук реального API: прогоняет весь контракт на живом сервере.
# Требует поднятые базу (npm run db:start) и API (npm run dev:api).
# Запуск: bash scripts/api-smoke.sh [базовый-URL]

set -u

BASE="${1:-http://localhost:8080/api}"
# Временный каталог относительным путём: curl нативный и не понимает MSYS-пути /tmp/...
TMP="$(mktemp -d -p . smoke.XXXXXX)"
FAILED=0

call() { # call МЕТОД ПУТЬ [тело] [токен]
  local method="$1" path="$2" body="${3:-}" token="${4:-}"
  local args=(-s -o "$TMP/body" -w '%{http_code}' -X "$method" "$BASE$path" -H 'content-type: application/json')
  [ -n "$token" ] && args+=(-H "authorization: Bearer $token")
  if [ -n "$body" ]; then
    # Тело всегда через файл: в инлайн-аргументах Windows ломает UTF-8.
    printf '%s' "$body" >"$TMP/req.json"
    args+=(-d "@$TMP/req.json")
  fi
  curl "${args[@]}"
}

expect() { # expect ОЖИДАЕМЫЙ_КОД ФАКТИЧЕСКИЙ_КОД ОПИСАНИЕ
  if [ "$1" = "$2" ]; then
    printf 'ok   %-42s %s\n' "$3" "$2"
  else
    printf 'FAIL %-42s ждали %s, получили %s — %s\n' "$3" "$1" "$2" "$(head -c 200 "$TMP/body")"
    FAILED=$((FAILED + 1))
  fi
}

json() { node -e "const d=JSON.parse(require('fs').readFileSync('$TMP/body','utf8'));console.log(d$1)" 2>/dev/null; }

EMAIL="smoke-$(date +%s)@test.local"

expect 200 "$(call GET /health)" 'health'
expect 200 "$(call GET '/hookers?limit=2')" 'список анкет'
expect 422 "$(call GET '/hookers?limit=999')" 'лимит больше максимума'
expect 200 "$(call GET '/hookers?sort=rating-desc&maxPrice=3000')" 'фильтр цены и сортировка'
expect 404 "$(call GET /hookers/00000000-0000-4000-8000-000000000000)" 'несуществующая анкета'
expect 404 "$(call GET /hookers/abc)" 'некорректный id'
expect 404 "$(call GET /hookers/%D0%BD%D0%B5-uuid)" 'не-uuid в пути'

expect 201 "$(call POST /auth/register "{\"email\":\"$EMAIL\",\"password\":\"smoke12345\",\"name\":\"Смоук\"}")" 'регистрация'
TOKEN="$(json .token)"
expect 409 "$(call POST /auth/register "{\"email\":\"$EMAIL\",\"password\":\"smoke12345\",\"name\":\"Смоук\"}")" 'дубль регистрации'
expect 401 "$(call POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"wrong12345\"}")" 'неверный пароль'
expect 200 "$(call POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"smoke12345\"}")" 'логин'
expect 200 "$(call GET /me '' "$TOKEN")" 'текущий пользователь'
expect 401 "$(call GET /me)" 'me без токена'
expect 200 "$(call PATCH /me '{"name":"Смоук 2","email":"'"$EMAIL"'"}' "$TOKEN")" 'правка профиля'

expect 422 "$(call POST /hookers '{"name":"А","age":12}' "$TOKEN")" 'валидация анкеты'
expect 201 "$(call POST /hookers '{"name":"Тестовая","age":25,"city":"Москва","region":"Москва и область","phone":"+7 999 000-00-01","height":170,"pricePerHour":3000,"services":["Классика"],"about":"Смоук-анкета"}' "$TOKEN")" 'создание анкеты'
ID="$(json .id)"
expect 200 "$(call GET "/hookers/$ID")" 'чтение своей анкеты'
expect 200 "$(call PATCH "/hookers/$ID" '{"pricePerHour":3200}' "$TOKEN")" 'правка анкеты'
expect 200 "$(call GET /me/hookers '' "$TOKEN")" 'мои анкеты'
expect 200 "$(call GET /me/history '' "$TOKEN")" 'история просмотров'

expect 422 "$(call POST "/hookers/$ID/reviews" '{"rating":9,"text":"коротко"}' "$TOKEN")" 'валидация отзыва'
expect 201 "$(call POST "/hookers/$ID/reviews" '{"rating":5,"text":"Отличная анкета, всё по описанию"}' "$TOKEN")" 'создание отзыва'
expect 409 "$(call POST "/hookers/$ID/reviews" '{"rating":4,"text":"Второй отзыв от того же автора"}' "$TOKEN")" 'дубль отзыва'
expect 200 "$(call GET "/hookers/$ID/reviews?sort=best")" 'список отзывов'
expect 200 "$(call GET /me/reviews '' "$TOKEN")" 'мои отзывы'
expect 200 "$(call GET /stats/districts)" 'плотность по районам'

expect 204 "$(call PUT "/favorites/$ID" '' "$TOKEN")" 'в избранное'
expect 200 "$(call GET /favorites '' "$TOKEN")" 'список избранного'
expect 204 "$(call DELETE "/favorites/$ID" '' "$TOKEN")" 'из избранного'

expect 200 "$(call POST /auth/demo)" 'демо-логин'
DEMO_TOKEN="$(json .token)"
expect 204 "$(call POST /auth/logout '' "$DEMO_TOKEN")" 'выход'
expect 401 "$(call GET /me '' "$DEMO_TOKEN")" 'токен после выхода не работает'

expect 204 "$(call DELETE "/hookers/$ID" '' "$TOKEN")" 'удаление анкеты'
expect 404 "$(call GET "/hookers/$ID")" 'удалённая анкета не находится'
expect 404 "$(call GET /мусор)" 'неизвестная ручка'
expect 204 "$(call POST /auth/logout '' "$TOKEN")" 'выход смоук-аккаунта'

rm -rf "$TMP"
echo
if [ "$FAILED" -eq 0 ]; then
  echo "Смоук пройден целиком"
else
  echo "Провалено проверок: $FAILED"
  exit 1
fi
