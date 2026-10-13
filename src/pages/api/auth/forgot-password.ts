export const prerender = false;

// POST /api/auth/forgot-password
//
// Starts the password-reset flow: generates a single-use, time-limited token
// for the account and emails a reset link through the SMTP mailbox the
// business owns (see src/lib/mailer.ts).
//
// The response is intentionally identical whether or not the email belongs to
// an account, so the endpoint cannot be used to enumerate registered users.
import type { APIRoute } from 'astro';
import crypto from 'crypto';
import { client } from '../../../lib/db/connection';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';
import { sendMail, passwordResetEmail, mailIsConfigured } from '@lib/mailer';

const RESET_TTL_MINUTES = 60;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function genericResponse(): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message:
        'If an account exists for that email, we have sent a password reset link. Please check your inbox (and spam folder).',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit by IP so the endpoint can't be used to spam a mailbox.
    const limit = checkRateLimit(`forgot:${clientIp(request)}`, 5, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

    const body = await request.json().catch(() => ({} as any));
    const email = String((body && body.email) || '').toLowerCase().trim();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Please enter a valid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sql = client;

    const users = await sql`
      SELECT id, full_name, email
      FROM users
      WHERE lower(email) = ${email} AND is_active = true
      LIMIT 1
    `;

    // Unknown account → return the same generic message (no enumeration).
    if (users.length === 0) return genericResponse();

    const user = users[0];

    if (!mailIsConfigured()) {
      console.error('forgot-password: SMTP is not configured — no email sent');
      return genericResponse();
    }

    // Invalidate any outstanding tokens, then issue a fresh one.
    await sql`
      UPDATE password_resets
      SET used_at = NOW()
      WHERE user_id = ${user.id} AND used_at IS NULL
    `;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    await sql`
      INSERT INTO password_resets (user_id, token_hash, expires_at)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt})
    `;

    const base = (process.env.PUBLIC_APP_URL || 'https://vault-of-wisdom.com').replace(/\/+$/, '');
    const resetUrl = `${base}/reset-password?token=${token}`;

    const mail = passwordResetEmail(resetUrl, user.full_name, RESET_TTL_MINUTES);
    const sent = await sendMail({
      to: user.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    if (!sent) {
      console.error('forgot-password: failed to deliver reset email for', user.email);
    }

    return genericResponse();
  } catch (error) {
    console.error('forgot-password error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
