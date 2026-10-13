#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Wisdom Vault — finalize migration on the VPS (run as miracle, NO sudo).
# ⚠️  RETIRED (2026-09-17): Neon is decommissioned — both apps now run on the
#     VPS database, which is the single source of truth. Re-running this script
#     would DROP the public schema on the VPS and restore it from the retired
#     Neon database. It refuses to run unless FORCE_FINALIZE=1 is set.
# Assumes ~/setup-postgres.sh has already been run with sudo.
#
#   bash ~/finalize-migration.sh
#
# 1. Dumps the live Neon DB from this VPS (PG18 client → no version mismatch)
# 2. Restores it into the local PostgreSQL 18 database
# 3. Verifies row counts
# 4. Installs the daily reconcile cron (03:00 UTC)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ "${FORCE_FINALIZE:-0}" != "1" ]; then
  cat <<'MSG'

⚠️  This script is RETIRED and will not run.

    Neon is decommissioned; the VPS database is now the only production DB.
    Running this would DROP the public schema here and restore it from Neon.

    If you really intend to do that:
        FORCE_FINALIZE=1 bash ~/finalize-migration.sh

MSG
  exit 1
fi

# Retired Neon source database (read-only history; do not expect it to exist).
NEON_URL="postgresql://neondb_owner:npg_Uq1IvnGlBM2b@ep-bold-morning-b1qgpg0i-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require"
LOCAL_URL="postgresql://wisdom_vault:ab0968aa54a5690656104ec36076b763@127.0.0.1:5432/wisdom_vault"
PSQL=/usr/pgsql-18/bin/psql
PG_DUMP=/usr/pgsql-18/bin/pg_dump
PG_RESTORE=/usr/pgsql-18/bin/pg_restore
DUMP="$HOME/neon-final-$(date +%Y%m%d-%H%M%S).dump"

echo "== 1/4 Dumping live Neon database =="
"$PG_DUMP" -Fc --no-owner --no-privileges "$NEON_URL" -f "$DUMP"
ls -lh "$DUMP"

echo "== 2/4 Restoring into local PostgreSQL 18 =="
# Reset schema first so this script is safe to RE-RUN (e.g. a final re-sync at
# DNS cutover). Extensions live in the schema, so re-create uuid-ossp after.
"$PSQL" "$LOCAL_URL" -q \
  -c "DROP SCHEMA public CASCADE;" \
  -c "CREATE SCHEMA public;" \
  -c "GRANT ALL ON SCHEMA public TO wisdom_vault;" \
  -c "GRANT ALL ON SCHEMA public TO public;" \
  -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
# Filter EXTENSION/COMMENT entries out of the TOC: they require superuser and
# uuid-ossp is created separately above.
"$PG_RESTORE" -l "$DUMP" > "$DUMP.list"
grep -v -E ' EXTENSION | COMMENT - EXTENSION ' "$DUMP.list" > "$DUMP.filtered.list" || true
"$PG_RESTORE" --no-owner --no-privileges --exit-on-error -L "$DUMP.filtered.list" -d "$LOCAL_URL" "$DUMP"
rm -f "$DUMP.list" "$DUMP.filtered.list"

echo "== 3/4 Verifying =="
USERS_COUNT=$("$PSQL" "$LOCAL_URL" -t -A -c "SELECT count(*) FROM users;")
TABLES=$("$PSQL" "$LOCAL_URL" -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
echo "   users: $USERS_COUNT"
echo "   public tables: $TABLES"
"$PSQL" "$LOCAL_URL" -t -A -c "SELECT '   newest_user: ' || max(created_at) FROM users;"

echo "== 4/4 Installing daily reconcile cron (03:00 UTC) =="
CRON_SECRET=$(grep '^CRON_SECRET=' "$HOME/app/.env" | cut -d= -f2)
TMP_CRON="$(mktemp)"
crontab -l 2>/dev/null | grep -v 'api/cron/reconcile-withdrawals' > "$TMP_CRON" || true
cat >> "$TMP_CRON" <<CRON
0 3 * * * curl -s -m 120 -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:4321/api/cron/reconcile-withdrawals >/dev/null 2>&1 # wisdomvault reconcile
CRON
crontab "$TMP_CRON"
rm -f "$TMP_CRON"
crontab -l | tail -2

echo
echo "✅ Migration finalized. Database is local and populated."
echo "   Next: pm2 restart wisdomvault --update-env && pm2 logs wisdomvault"
