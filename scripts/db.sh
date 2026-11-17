#!/usr/bin/env bash
# Локальный Postgres для разработки: данные лежат ВНЕ репозитория (D:\hermes\pgdata).
# Бинари отдельно от системного Postgres, порт 5433 (5432 занят службой).
#
# Запуск: bash scripts/db.sh start | stop | status | psql
#
# Важно: дочерним процессам postgres нужен чистый PATH без /usr/bin от git-bash,
# иначе бэкенды падают с 0xC0000142 (DLL init failed) при первом подключении.
# Поэтому postgres стартует напрямую, а не через pg_ctl.

set -u

PG_BIN="${PG_BIN:-/c/Users/NextM/pgsql/bin}"
PGDATA_WIN="${PGDATA_WIN:-D:/hermes/pgdata}"
PGLOG="${PGLOG:-D:/hermes/pg.log}"
PORT="${PGPORT:-5433}"
DB_NAME="${DB_NAME:-hookers}"

# PATH для логики скрипта: утилиты MSYS (sleep/nohup) + бинари Postgres.
# Сам postgres стартует с env -i и чистым PATH (см. ниже).
export PATH="$PG_BIN:/usr/bin:/bin:/c/Windows/system32:/c/Windows"
postgres_bin="$PG_BIN/postgres"
psql_bin="$PG_BIN/psql"
pg_ctl_bin="$PG_BIN/pg_ctl"

psql_run() { "$psql_bin" -w -h 127.0.0.1 -p "$PORT" -U postgres "$@"; }

alive() { psql_run -Atc 'select 1' >/dev/null 2>&1; }

case "${1:-status}" in
  start)
    if alive; then
      echo "Postgres уже запущен на :$PORT"
      exit 0
    fi
    [ -d "$PGDATA_WIN" ] || { echo "Нет каталога данных $PGDATA_WIN" >&2; exit 1; }
    nohup env -i PATH="/c/Windows/system32:$PG_BIN" TZ="${TZ:-}" \
      "$postgres_bin" -D "$PGDATA_WIN" -p "$PORT" >>"$PGLOG" 2>&1 &
    i=0
    while [ "$i" -lt 60 ]; do
      alive && { echo "Postgres поднят на :$PORT (данные: $PGDATA_WIN)"; exit 0; }
      sleep 1
      i=$((i + 1))
    done
    echo "Не поднялся за 60 с, смотри $PGLOG" >&2
    exit 1
    ;;
  stop)
    if ! alive; then
      echo "Postgres и так не запущен"
      exit 0
    fi
    "$pg_ctl_bin" -D "$PGDATA_WIN" -m fast -w stop
    ;;
  status)
    if alive; then
      echo "Postgres работает на :$PORT"
    else
      echo "Postgres не отвечает на :$PORT"
      exit 1
    fi
    ;;
  psql)
    shift
    psql_run -d "$DB_NAME" "$@"
    ;;
  *)
    echo "Использование: bash scripts/db.sh start|stop|status|psql [аргументы psql]" >&2
    exit 2
    ;;
esac
