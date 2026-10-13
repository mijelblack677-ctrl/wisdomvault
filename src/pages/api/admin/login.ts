export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '../../../lib/db/connection';
import bcrypt from 'bcryptjs';
import { checkRateLimit, clientIp, rateLimitResponse, isPasswordLocked, recordPasswordFailure, clearPasswordFailures } from '../../../lib/rate-limit';

const MAX_PASSWORD_FAILURES = 3;

export const POST: APIRoute = async ({ request }) => {
  const sql = client;

  try {
    // Rate limit per client IP — admin login is the highest-value brute-force
    // target on the app and previously had NO limiting at all.
    const limit = checkRateLimit(`login:admin:${clientIp(request)}`, 10, 60_000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSeconds);
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // ✅ Support both 'identifier' and 'email' for backward compatibility
    const identifier = body.identifier || body.email;
    const password = body.password;

    if (!identifier || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email/Phone and password required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ── PER-ACCOUNT LOCKOUT (same policy as user login) ──────────────
    const normalizedId = ('admin:' + identifier).toLowerCase().trim();
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

    // ✅ Check if identifier is email or phone
    const isEmail = identifier.includes('@') && identifier.includes('.');
    
    let admins;
    if (isEmail) {
      admins = await sql`
        SELECT * FROM admin_users 
        WHERE email = ${identifier} AND is_active = true
      `;
    } else {
      // Search by username (admin_users table doesn't have phone column)
      admins = await sql`
        SELECT * FROM admin_users 
        WHERE username = ${identifier} AND is_active = true
      `;
    }
    
    if (admins.length === 0) {
      // Record failure even for unknown identifiers so attackers can't
      // probe which admin accounts exist via lockout behaviour.
      recordPasswordFailure(normalizedId);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid credentials' 
      }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const admin = admins[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    
    if (!valid) {
      const attempt = recordPasswordFailure(normalizedId);
      const msg = attempt.locked
        ? `Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(attempt.retryAfterSeconds / 60)} minute(s).`
        : 'Invalid credentials';
      return new Response(JSON.stringify({ 
        success: false,
        message: msg,
        ...(attempt.locked && { locked: true, retryAfterSeconds: attempt.retryAfterSeconds }),
      }), {
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

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      admin: { 
        id: admin.id, 
        username: admin.username, 
        email: admin.email
      },
      token,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin login error:', err);
    // SECURITY: log the details server-side, return a generic message so we
    // don't leak internals (SQL errors etc.) to unauthenticated callers.
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Login failed. Please try again.'
    }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
