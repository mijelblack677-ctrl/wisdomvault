#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Wisdom Vault — VPS security hardening (AlmaLinux 9). Run with sudo:
#   sudo bash ~/harden-vps.sh
#
# 1. firewalld: allow ssh/http/https + 5432 (Postgres/TLS). 5432 is REQUIRED:
#    the Vercel app connects to this Postgres over the internet, so closing it
#    takes wisdom-vault-peach down. Connections are SSL-only + scram-authed and
#    only the wisdom_vault database/user is reachable (see expose-postgres.sh).
#    The app on this host (4321) stays loopback-only behind nginx/http.
# 2. fail2ban: SSH brute-force protection
# 3. sshd: disable root login; disable password auth ONLY if your user has an
#    SSH key installed (checked — you won't get locked out)
# 4. dnf-automatic: automatic security updates
# Safe to re-run. Backs up sshd_config before touching it.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "Run with: sudo bash $0" >&2; exit 1; fi

echo "== 1/4 firewalld: ssh/http/https + 5432 =="
dnf -y install firewalld >/dev/null
systemctl enable --now firewalld >/dev/null 2>&1 || true
firewall-cmd --permanent --add-service=ssh  >/dev/null
firewall-cmd --permanent --add-service=http >/dev/null
firewall-cmd --permanent --add-service=https >/dev/null
# Postgres for the Vercel app (SSL-only, see expose-postgres.sh) — do NOT close.
firewall-cmd --permanent --add-port=5432/tcp >/dev/null
firewall-cmd --reload >/dev/null
echo "   open: $(firewall-cmd --list-services | tr '\n' ' ')"

echo "== 2/4 fail2ban (SSH brute-force protection) =="
dnf -y install epel-release >/dev/null 2>&1 || true
dnf -y install fail2ban fail2ban-firewalld >/dev/null
cat > /etc/fail2ban/jail.local <<'JAIL'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
JAIL
systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl is-active --quiet fail2ban && echo "   fail2ban active" || echo "   ⚠ fail2ban failed to start"

echo "== 3/4 sshd hardening =="
SSHD=/etc/ssh/sshd_config
cp "$SSHD" "$SSHD.bak.$(date +%Y%m%d%H%M%S)"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "$SSHD"
# Only disable password logins if the 'miracle' user actually has an SSH key.
if [ -s /home/miracle/.ssh/authorized_keys ]; then
  sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD"
  echo "   key auth detected → password logins disabled"
else
  echo "   ⚠ no SSH key for miracle — password logins LEFT ON (add a key, re-run)"
fi
if sshd -t 2>/dev/null; then
  systemctl reload sshd
  echo "   sshd reloaded OK (root login: no$( [ -s /home/miracle/.ssh/authorized_keys ] && echo ', passwords: no' ))"
else
  echo "   ⚠ sshd config invalid — restoring backup"
  cp "$SSHD".bak.* "$SSHD" 2>/dev/null || true
  systemctl reload sshd || true
fi

echo "== 4/4 automatic security updates =="
dnf -y install dnf-automatic >/dev/null
sed -i 's/^apply_updates = .*/apply_updates = yes/' /etc/dnf/automatic.conf
systemctl enable --now dnf-automatic.timer >/dev/null 2>&1 || true
echo "   dnf-automatic enabled"

echo
echo "✅ Hardening complete. Verify you can still SSH in from a NEW terminal:"
echo "   ssh miracle@185.131.54.4"
