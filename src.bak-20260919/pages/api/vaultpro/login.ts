export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import bcrypt from 'bcryptjs';

/**
 * POST /api/vaultpro/login
 *
 * Superadmin-only login for the /vaultpro panel. Unlike the regular admin
 * login, this endpoint ONLY accepts admin_users with role = 'super_admin'.
 * Sessions are stored in admin_sessions (same table as the admin panel) so a
 * superadmin token is also accepted by the existing /api/admin/* endpoints.
 */
export const POST: APIRoute = async ({ request }) => {
  const sql = client;

  try {
    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const identifier = body.identifier || body.email;
    const password = body.password;

    if (!identifier || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Username/Email and password required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Look up by username OR email
    let admins = await sql`
      SELECT * FROM admin_users
      WHERE (email = ${identifier} OR username = ${identifier})
        AND is_active = true
    `;

    // ── First-run auto-provisioning ─────────────────────────────────────────
    // If VAULTPRO_USERNAME / VAULTPRO_EMAIL / VAULTPRO_PASSWORD env vars are
    // configured and the matching account does not exist yet, create it as a
    // super_admin on the very first login attempt. This lets a fresh deploy
    // work without running any SQL by hand.
    if (admins.length === 0 && process.env.VAULTPRO_PASSWORD) {
      const envUsername = process.env.VAULTPRO_USERNAME || 'vaultpro';
      const envEmail = process.env.VAULTPRO_EMAIL || 'vaultpro@wisdomvault.com';
      const isEnvMatch =
        identifier === envUsername ||
        identifier.toLowerCase() === envEmail.toLowerCase();

      if (isEnvMatch && password === process.env.VAULTPRO_PASSWORD) {
        const passwordHash = await bcrypt.hash(password, 10);
        const created = await sql`
          INSERT INTO admin_users (username, email, password_hash, role, is_active, created_at)
          VALUES (${envUsername}, ${envEmail}, ${passwordHash}, 'super_admin', true, NOW())
          ON CONFLICT (username) DO NOTHING
          RETURNING id, username, email, role, is_active
        `;
        console.log('🛠  VaultPro superadmin auto-provisioned from env vars');
        admins = created;
      }
    }

    if (admins.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid credentials' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const admin = admins[0];

    // HARD gate: only super_admin role may enter the VaultPro panel
    if (admin.role !== 'super_admin') {
      return new Response(JSON.stringify({
        success: false,
        message: 'This account is not authorized for the SuperAdmin panel.',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid credentials' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO admin_sessions (admin_id, token, expires_at)
      VALUES (${admin.id}, ${token}, ${expiresAt.toISOString()})
    `;

    await sql`
      UPDATE admin_users SET last_login = NOW() WHERE id = ${admin.id}
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'SuperAdmin login successful',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      token,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    const err = error as Error;
    console.error('VaultPro login error:', err);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};