#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Wisdom Vault — PostgreSQL 18 setup for AlmaLinux 9
#
# Run ON THE VPS with:
#   sudo bash ~/setup-postgres.sh
#
# Installs PostgreSQL 18 (PGDG repo), initializes the cluster, and creates:
#   - role  wisdom_vault  (password: ab0968aa54a5690656104ec36076b763)
#   - db    wisdom_vault  (owner: wisdom_vault)
# TCP access starts restricted to 127.0.0.1 (loopback) — the app connects
# locally. ~/expose-postgres.sh later adds TLS + remote access for the
# Vercel app and rotates the password again; keep that in mind before re-running
# this script (it would reset the password back to the value below).
# Safe to re-run: every step is idempotent.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Run with sudo:  sudo bash $0" >&2
  exit 1
fi

echo "== 1/5 Installing PGDG repo + PostgreSQL 18 =="
dnf -y install 'https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm'
dnf -qy module disable postgresql || true
dnf -y install postgresql18-server postgresql18 postgresql18-contrib

echo "== 2/5 Initializing cluster =="
if [ ! -f /var/lib/pgsql/18/data/PG_VERSION ]; then
  /usr/pgsql-18/bin/postgresql-18-setup initdb
else
  echo "   cluster already initialized, skipping"
fi

echo "== 3/5 Configuring pg_hba (app user via loopback, scram) =="
HBA=/var/lib/pgsql/18/data/pg_hba.conf
if ! grep -q "added by setup-postgres.sh" "$HBA"; then
  cp "$HBA" "$HBA.bak.$(date +%Y%m%d%H%M%S)"
  # Prepend so these lines win over the stock ident/peer rules.
  cat > /tmp/pg_hba_addition <<'HBA'
# --- added by setup-postgres.sh ---
host    wisdom_vault    wisdom_vault    127.0.0.1/32            scram-sha-256
HBA
  cat /tmp/pg_hba_addition "$HBA" > /tmp/pg_hba_new && cp /tmp/pg_hba_new "$HBA"
  rm -f /tmp/pg_hba_addition /tmp/pg_hba_new
else
  echo "   pg_hba already configured, skipping"
fi

echo "== 4/5 Enabling and starting PostgreSQL =="
systemctl enable --now postgresql-18 >/dev/null 2>&1 || true
sleep 2
systemctl is-active --quiet postgresql-18 || { echo "❌ postgresql-18 failed to start"; journalctl -u postgresql-18 --no-pager | tail -20; exit 1; }

echo "== 5/5 Creating role, database, and extension =="
sudo -u postgres /usr/pgsql-18/bin/psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wisdom_vault') THEN
    CREATE ROLE wisdom_vault LOGIN PASSWORD 'ab0968aa54a5690656104ec36076b763';
  ELSE
    ALTER ROLE wisdom_vault LOGIN PASSWORD 'ab0968aa54a5690656104ec36076b763' NOINHERIT;
  END IF;
END
$$;
SELECT 'CREATE DATABASE wisdom_vault OWNER wisdom_vault'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wisdom_vault')\gexec
ALTER DATABASE wisdom_vault OWNER TO wisdom_vault;
SQL
sudo -u postgres /usr/pgsql-18/bin/psql -d wisdom_vault -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'

echo "== Verifying app connection (TCP, scram) =="
PGPASSWORD='ab0968aa54a5690656104ec36076b763' /usr/pgsql-18/bin/psql -h 127.0.0.1 -U wisdom_vault -d wisdom_vault -t -c "SELECT 'VPS_DB_READY', version();"

echo
echo "✅ PostgreSQL 18 is running (loopback only, port 5432)."
echo "   The app will use:"
echo "   postgresql://wisdom_vault:ab0968aa54a5690656104ec36076b763@127.0.0.1:5432/wisdom_vault"
