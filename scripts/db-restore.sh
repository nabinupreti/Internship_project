#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file.sql.gz>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.yml}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-job_portal}"
BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if docker compose -f "$COMPOSE_FILE" ps db >/dev/null 2>&1; then
  gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
  echo "Restore completed from $BACKUP_FILE"
  exit 0
fi

if command -v psql >/dev/null 2>&1; then
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL is required when Docker is not running." >&2
    exit 1
  fi
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
  echo "Restore completed from $BACKUP_FILE"
  exit 0
fi

echo "No running Docker DB container and psql not found." >&2
exit 1
