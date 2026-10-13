#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Wisdom Vault — nightly local DB backup with retention.
# Retention: keeps the newest 14 dumps, prunes older ones.
# Run:  bash ~/db-backup.sh          (manual run / cron runs it the same way)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

LOCAL_URL="postgresql://wisdom_vault:ab0968aa54a5690656104ec36076b763@127.0.0.1:5432/wisdom_vault"
PG_DUMP=/usr/pgsql-18/bin/pg_dump
BACKUP_DIR="$HOME/db-backups"
KEEP=14

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/wisdomvault-$STAMP.dump"

"$PG_DUMP" -Fc --no-owner --no-privileges "$LOCAL_URL" -f "$OUT"

# Prune old dumps (keep newest $KEEP)
ls -1t "$BACKUP_DIR"/wisdomvault-*.dump 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') backup OK: $OUT ($(du -h "$OUT" | cut -f1), $(ls -1 "$BACKUP_DIR"/wisdomvault-*.dump | wc -l) dumps retained)"
