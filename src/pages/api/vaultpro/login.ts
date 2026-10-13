export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import bcrypt from 'bcryptjs';
import { checkRateLimit, clientIp, rateLimitResponse, isPasswordLocked, recordPasswordFailure, clearPasswordFailures } from '@lib/rate-limit';

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
    // Rate limit per client IP — this is the superadmin panel login.
    const limit = checkRateLimit(`login:vaultpro:${clientIp(request)}`, 10, 60_000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSeconds);
    }

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

    // ── PER-ACCOUNT LOCKOUT (same policy as admin/user login) ────────
    const normalizedId = ('vaultpro:' + identifier).toLowerCase().trim();
    const lockCheck = isPasswordLocked(normalizedId);
    if (lockCheck.locked) {
      const mins = Math.ceil(lockCheck.retryAfterSeconds / 60);
      return new Response(JSON.stringify({
        success: false,
        message: `Account temporarily locked due to too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`,
        locked: true,
        retryAfterSeconds: lockCheck.retryAfterSeconds,
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(lockCheck.retryAfterSeconds) }
      });
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
      recordPasswordFailure(normalizedId);
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
      const attempt = recordPasswordFailure(normalizedId);
      const msg = attempt.locked
        ? `Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(attempt.retryAfterSeconds / 60)} minute(s).`
        : 'Invalid credentials';
      return new Response(JSON.stringify({ success: false, message: msg, ...(attempt.locked && { locked: true, retryAfterSeconds: attempt.retryAfterSeconds }) }), {
        status: attempt.locked ? 429 : 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Successful login — clear failure tracking
    clearPasswordFailures(normalizedId);

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
    // SECURITY: generic message outward, details in server logs only.
    return new Response(JSON.stringify({ success: false, message: 'Login failed. Please try again.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};