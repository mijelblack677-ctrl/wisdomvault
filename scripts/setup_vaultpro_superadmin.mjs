#!/usr/bin/env node
// scripts/setup_vaultpro_superadmin.mjs
//
// One-time / re-runnable provisioning of the VaultPro SuperAdmin account.
//   - Connects using DATABASE_URL (env, .env, or .env.local)
//   - Creates (or updates) the admin_users row with role = 'super_admin'
//   - Prints the login details for the /vaultpro panel
//
// Usage:
//   node scripts/setup_vaultpro_superadmin.mjs
//
// Optional env overrides:
//   VAULTPRO_USERNAME  (default: vaultpro)
//   VAULTPRO_EMAIL     (default: vaultpro@wisdomvault.com)
//   VAULTPRO_PASSWORD  (default: VaultPro@2026#Sup3r)
//
// It is safe to re-run: existing accounts get their password/role refreshed
// only when VAULTPRO_PASSWORD is explicitly provided.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── Load .env / .env.local (no dotenv dependency) ──────────────────────────
function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const fileEnv = { ...loadEnvFile(resolve(root, '.env.local')), ...loadEnvFile(resolve(root, '.env')) };
const DATABASE_URL = process.env.DATABASE_URL || fileEnv.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found. Set it in the environment or in .env');
  process.exit(1);
}

// ── Credentials ─────────────────────────────────────────────────────────────
const username = process.env.VAULTPRO_USERNAME || 'vaultpro';
const email = process.env.VAULTPRO_EMAIL || 'vaultpro@wisdomvault.com';
const password = process.env.VAULTPRO_PASSWORD || 'VaultPro@2026#Sup3r';

const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });

try {
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await sql`
    SELECT id, username, email, role FROM admin_users
    WHERE username = ${username} OR email = ${email}
  `;

  if (existing.length > 0) {
    // Refresh password + ensure super_admin role (only if password provided explicitly
    // via env; otherwise keep existing password).
    if (process.env.VAULTPRO_PASSWORD) {
      await sql`
        UPDATE admin_users
        SET password_hash = ${passwordHash}, role = 'super_admin', is_active = true
        WHERE id = ${existing[0].id}
      `;
      console.log('✅ Updated existing account password + role.');
    } else {
      await sql`
        UPDATE admin_users SET role = 'super_admin', is_active = true WHERE id = ${existing[0].id}
      `;
      console.log('✅ Existing account found — ensured super_admin role (password unchanged).');
    }
    console.log(`   Username: ${existing[0].username}`);
    console.log(`   Email:    ${existing[0].email}`);
  } else {
    await sql`
      INSERT INTO admin_users (username, email, password_hash, role, is_active, created_at)
      VALUES (${username}, ${email}, ${passwordHash}, 'super_admin', true, NOW())
    `;
    console.log('✅ SuperAdmin account created.');
    console.log(`   Username: ${username}`);
    console.log(`   Email:    ${email}`);
  }

  console.log('──────────────────────────────────────────────');
  console.log('🔐 VaultPro SuperAdmin panel:  /vaultpro');
  console.log('   Username: ' + (existing.length > 0 ? existing[0].username : username));
  console.log('   Email:    ' + (existing.length > 0 ? existing[0].email : email));
  console.log('   Password: ' + (process.env.VAULTPRO_PASSWORD ? '*** (from VAULTPRO_PASSWORD env) ***' : password));
  console.log('⚠️  Keep these credentials safe — this account has full control of the system.');
} catch (err) {
  console.error('❌ Setup failed:', err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}