export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '../../../lib/db/connection';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit, clientIp, rateLimitResponse, isPasswordLocked, recordPasswordFailure, clearPasswordFailures } from '@lib/rate-limit';

const MAX_PASSWORD_FAILURES = 3;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit per client IP — login is how the bot flood mints fresh
    // session tokens to keep hammering authenticated endpoints.
    const limit = checkRateLimit(`login:${clientIp(request)}`, 20, 60_000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSeconds);
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { identifier, password } = body;

    if (!identifier || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email/Phone and password required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Check if identifier is email or phone
    const isEmail = identifier.includes('@') && identifier.includes('.');
    
    let users;
    if (isEmail) {
      users = await sql`
        SELECT * FROM users 
        WHERE email = ${identifier} AND is_active = true
      `;
    } else {
      const cleanPhone = identifier.replace(/\s/g, '');
      users = await sql`
        SELECT * FROM users 
        WHERE phone = ${cleanPhone} AND is_active = true
      `;
    }    // ── PER-USER ACCOUNT LOCKOUT ──────────────────────────────────────
    // After 3 wrong passwords for the same email/phone, lock the account
    // for 15 minutes — regardless of which IP the attempts come from.
    // ──────────────────────────────────────────────────────────────────
    const normalizedId = identifier.toLowerCase().trim();
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
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(lockCheck.retryAfterSeconds),
        }
      });
    }

    if (users.length === 0) {
      // Identifier doesn't exist — still record a failure so attackers can't
      // enumerate valid accounts by checking lockout behaviour.
      recordPasswordFailure(normalizedId);
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      const attempt = recordPasswordFailure(normalizedId);
      const remaining = MAX_PASSWORD_FAILURES - attempt.count;
      const msg = attempt.locked
        ? `Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(attempt.retryAfterSeconds / 60)} minute(s).`
        : remaining <= 1
          ? `Invalid credentials. Warning: your account will be locked after ${remaining} more failed attempt.`
          : 'Invalid credentials';
      return new Response(JSON.stringify({ 
        success: false,
        message: msg,
        ...(attempt.locked && { locked: true, retryAfterSeconds: attempt.retryAfterSeconds }),
      }), {
        status: attempt.locked ? 429 : 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Successful login — clear any failure tracking
    clearPasswordFailures(normalizedId);

    // Generate and STORE session token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store the session in the database
    await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referral_code,
        paymentStatus: user.payment_status,
        isFoundingMember: user.is_founding_member
      },
      token: token,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Login error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
