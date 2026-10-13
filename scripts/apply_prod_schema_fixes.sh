#!/usr/bin/env bash
#
# Applies two missing production schema changes to the live database:
#   1. users.consent_given_at timestamptz (from drizzle/0003, never applied)
#   2. audit_logs table + indexes (referenced by vaultpro/admin endpoints, never created)
#
# Transport: psql over TLS to the VPS PostgreSQL — the same database both apps
# (wisdom-vault-peach on Vercel and wisdomvault.online on the VPS) read/write.
# (Previously this used Neon's HTTPS SQL API; Neon has since been decommissioned.)
#
# Both DDL statements are idempotent (IF NOT EXISTS). Includes a write probe
# (insert + delete) and full verification. Requires: bash, psql.
#
# Run:  bash scripts/apply_prod_schema_fixes.sh
# Override the target with CONN or PSQL, e.g.:
#   CONN='postgresql://wisdom_vault:<pass>@127.0.0.1:5432/wisdom_vault' bash scripts/apply_prod_schema_fixes.sh
#
set -euo pipefail

# ── Config (same connection as db_config.py) ────────────────────────────────
CONN="${CONN:-postgresql://wisdom_vault:ab0968aa54a5690656104ec36076b763@185.131.54.4:5432/wisdom_vault?sslmode=require}"
PSQL="${PSQL:-psql}"

step() { printf '\n== %s ==\n' "$*"; }
ok()   { printf '  ✅ %s\n' "$*"; }
fail() { printf '  ❌ %s\n' "$*"; exit 1; }

# ── SQL over psql ───────────────────────────────────────────────────────────
# sql "<label>" "<query>" — prints the query output; aborts on error.
sql() {
  local label="$1" query="$2" out
  if ! out="$("$PSQL" "$CONN" -v ON_ERROR_STOP=1 -t -A -q -c "$query" 2>&1)"; then
    printf '  ❌ %s\n%s\n' "$label" "$out" >&2
    exit 1
  fi
  printf '%s\n' "$out"
}

# rows "<label>" "<sql>" — asserts at least one row and prints it.
rows() {
  local out
  out="$(sql "$1" "$2")"
  [ -n "$out" ] || fail "$1 returned no rows"
  printf '%s\n' "$out"
}

step "Connectivity check"
[ "$(sql "SELECT 1" "SELECT 1")" = "1" ] \
  && ok "Connected: $(sql "target" "SELECT current_user || '@' || inet_server_addr() || ':' || inet_server_port() || '/' || current_database()")"

step "Applying migrations"
sql "consent_given_at column" \
  "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_given_at timestamp with time zone;" >/dev/null
ok "users.consent_given_at ensured"

sql "audit_logs table" \
  "CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    admin_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action character varying(100) NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip character varying(64),
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);" >/dev/null
ok "audit_logs table ensured"

for IDX in \
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at);" \
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);" \
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs (admin_id);"; do
  sql "index" "$IDX" >/dev/null
done
ok "audit_logs indexes ensured"

step "Verification"
echo "  consent_given_at: $(rows "consent check" "SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='consent_given_at'")"

echo "  audit_logs relation: $(rows "relation check" "SELECT to_regclass('public.audit_logs')::text AS reg")"

echo "  columns: $(rows "column check" "SELECT string_agg(column_name || '(' || data_type || ')', ', ' ORDER BY ordinal_position) AS cols FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs'")"

step "Write probe (insert + delete)"
sql "probe insert" "INSERT INTO public.audit_logs (action, details) VALUES ('__schema_probe', '{\"probe\":true}'::jsonb);" >/dev/null
ok "insert succeeded"
PROBE_COUNT="$(sql "probe count" "SELECT count(*) FROM public.audit_logs WHERE action='__schema_probe';")"
[ "$PROBE_COUNT" = "1" ] && ok "probe row present" || fail "expected 1 probe row, got $PROBE_COUNT"
sql "probe cleanup" "DELETE FROM public.audit_logs WHERE action='__schema_probe';" >/dev/null
LEFT="$(sql "probe recount" "SELECT count(*) FROM public.audit_logs WHERE action='__schema_probe';")"
[ "$LEFT" = "0" ] && ok "probe row removed — table writable by the API endpoints" || fail "probe rows remain ($LEFT)"

step "Result"
echo "🎉 Production schema is up to date: consent_given_at + audit_logs are live."
