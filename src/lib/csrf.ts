// src/lib/csrf.ts
import crypto from 'crypto';
import { client } from './db/connection';

/**
 * Generate a CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store a CSRF token in the database with a 1-hour expiry.
 */
export async function storeCsrfToken(token: string): Promise<void> {
  const sql = client;
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  await sql`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES ('00000000-0000-0000-0000-000000000000', ${'csrf:' + token}, ${expiresAt})
    ON CONFLICT (token) DO UPDATE SET expires_at = ${expiresAt}
  `;
}

/**
 * Validate a CSRF token against the database.
 * Tokens prefixed with 'csrf:' are stored in user_sessions.
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  const sql = client;
  try {
    const rows = await sql`
      SELECT id FROM user_sessions
      WHERE token = ${'csrf:' + token} AND expires_at > NOW()
      LIMIT 1
    `;
    return rows.length > 0;
  } catch {
    return false;
  }
}
