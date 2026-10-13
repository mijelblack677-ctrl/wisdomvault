export const prerender = false;

// POST /api/auth/reset-password
//
// Completes the flow started by /api/auth/forgot-password: validates the
// single-use token from the emailed link, sets the new password and invalidates
// every outstanding reset token plus any existing login sessions.
import type { APIRoute } from 'astro';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { client } from '../../../lib/db/connection';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

const MIN_PASSWORD_LENGTH = 6;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const limit = checkRateLimit(`reset:${clientIp(request)}`, 10, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

    const body = await request.json().catch(() => ({} as any));
    const token = String((body && body.token) || '').trim();
    const password = String((body && body.password) || '');

    if (!token) {
      return json({ success: false, message: 'This reset link is invalid or has expired.' }, 400);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return json(
        { success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` },
        400
      );
    }

    const sql = client;
    const tokenHash = sha256(token);

    const rows = await sql`
      SELECT id, user_id, expires_at, used_at
      FROM password_resets
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return json({ success: false, message: 'This reset link is invalid or has expired.' }, 400);
    }

    const record = rows[0];

    if (record.used_at) {
      return json(
        { success: false, message: 'This reset link has already been used. Please request a new one.' },
        400
      );
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return json(
        { success: false, message: 'This reset link has expired. Please request a new one.' },
        400
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${record.user_id}
    `;

    // Single-use: burn this token and any other outstanding ones.
    await sql`
      UPDATE password_resets
      SET used_at = NOW()
      WHERE user_id = ${record.user_id} AND used_at IS NULL
    `;

    // A password reset should end any existing sessions.
    await sql`DELETE FROM user_sessions WHERE user_id = ${record.user_id}`;

    // In-app notification (best-effort; never fail the reset over it).
    try {
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${record.user_id},
          'system',
          '🔐 Password Reset',
          'Your password was reset using the forgot-password link. If you did not do this, contact support immediately.',
          '/dashboard'
        )
      `;
    } catch (notifyError) {
      console.error('reset-password: notification insert failed:', (notifyError as Error).message);
    }

    return json({
      success: true,
      message: 'Your password has been reset. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('reset-password error:', error);
    return json({ success: false, message: 'Something went wrong. Please try again.' }, 500);
  }
};
