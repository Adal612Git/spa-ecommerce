#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

FILE="$BACKUP_DIR/$(date +%F_%H-%M-%S).sql.gz"
pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "Backup saved to $FILE"
