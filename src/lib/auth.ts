import { client } from './db/connection';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  referralCode: string;
  isFoundingMember: boolean;
}

/**
 * Validate a session token against the user_sessions table.
 * Returns the user if the token is valid and not expired, null otherwise.
 */
export async function getUserFromSession(sessionToken: string | undefined): Promise<SessionUser | null> {
  if (!sessionToken) return null;

  try {
    const sql = client;
    const sessions = await sql`
      SELECT s.user_id, u.full_name, u.email, u.referral_code, u.is_founding_member
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.is_active = true
      LIMIT 1
    `;

    if (sessions.length === 0) return null;

    const row = sessions[0];
    return {
      id: row.user_id,
      fullName: row.full_name,
      email: row.email,
      referralCode: row.referral_code,
      isFoundingMember: row.is_founding_member ?? false,
    };
  } catch {
    return null;
  }
}

/**
 * Extract the Bearer token from the Authorization header.
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Get the authenticated user from a request.
 * Combines token extraction + session validation.
 */
export async function getAuthUser(request: Request): Promise<SessionUser | null> {
  const token = extractBearerToken(request);
  if (!token) return null;
  return getUserFromSession(token);
}
