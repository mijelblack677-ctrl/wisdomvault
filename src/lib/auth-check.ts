import { client } from './db/connection';
import { getAuthUser, type SessionUser } from './auth';

/**
 * Verify a user exists and is active by ID.
 * Used for direct userId checks after auth is established.
 */
export async function verifyUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  const sql = client;

  try {
    const users = await sql`SELECT id FROM users WHERE id = ${userId} AND is_active = true`;
    return users.length > 0;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

/**
 * Extract and validate the authenticated user from a request.
 * Checks Bearer token first, falls back to ?userId query param for backwards compatibility.
 * Returns the user if valid, null otherwise.
 */
export async function getAuthenticatedUser(request: Request): Promise<SessionUser | null> {
  // Bearer token only. The old ?userId= query-param fallback was removed:
  // it let anyone with a discovered user id impersonate that user (no
  // token required) — a hole the bot flood was actively exploiting.
  return getAuthUser(request);
}

/**
 * Require a valid Bearer token AND that the authenticated user matches the
 * claimed userId. Use this on every endpoint that trusts a client-supplied
 * userId (query param or body) so a caller can only ever act as themselves.
 */
export async function isAuthorizedUser(request: Request, claimedUserId: string): Promise<boolean> {
  const user = await getAuthenticatedUser(request);
  if (!user) return false;
  return user.id === claimedUserId;
}
