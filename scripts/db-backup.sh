#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.yml}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-job_portal}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/job_portal_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

if docker compose -f "$COMPOSE_FILE" ps db >/dev/null 2>&1; then
  docker compose -f "$COMPOSE_FILE" exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$OUT_FILE"
  echo "Backup saved to $OUT_FILE"
  exit 0
fi

if command -v pg_dump >/dev/null 2>&1; then
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL is required when Docker is not running." >&2
    exit 1
  fi
  pg_dump "$DATABASE_URL" | gzip > "$OUT_FILE"
  echo "Backup saved to $OUT_FILE"
  exit 0
fi

echo "No running Docker DB container and pg_dump not found." >&2
exit 1
