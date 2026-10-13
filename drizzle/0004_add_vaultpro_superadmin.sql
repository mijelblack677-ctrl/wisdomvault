-- VaultPro SuperAdmin panel (/vaultpro)
--
-- Seeds the dedicated superadmin account used by the /vaultpro panel.
-- The panel login (/api/vaultpro/login) ONLY accepts admin_users with
-- role = 'super_admin', so this account is intentionally separate from the
-- regular admin account.
--
-- NOTE: You can re-provision / change the password at any time with:
--   node scripts/setup_vaultpro_superadmin.mjs
-- (it reads DATABASE_URL from the environment or .env)

INSERT INTO admin_users (username, email, password_hash, role, is_active, created_at)
VALUES (
  'vaultpro',
  'vaultpro@wisdomvault.com',
  '$2b$10$TtaZ6kxDBkLxtxp/iE9N.e7ipUWcTgJrgbKZi47Hnk.Yn3G1ov0aG',
  'super_admin',
  true,
  NOW()
)
ON CONFLICT (username) DO NOTHING
ON CONFLICT (email) DO NOTHING;