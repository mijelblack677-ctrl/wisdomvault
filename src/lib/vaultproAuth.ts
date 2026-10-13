// src/lib/vaultproAuth.ts
// Shared authentication for the VaultPro superadmin panel (/vaultpro).
//
// VaultPro sessions live in the same admin_sessions table used by the regular
// admin panel, but every /api/vaultpro/* endpoint ALSO requires the session to
// belong to an active admin with role = 'super_admin'. A normal admin token can
// therefore never be used against these endpoints.

import { client } from './db/connection';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Validate the Authorization header and return the superadmin admin row.
 * Throws a Response (401) when the session is missing/expired or the admin is
 * not an active super_admin.
 */
export async function requireVaultPro(request: Request): Promise<any> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw jsonResponse({ success: false, message: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    const rows = await sql`
      SELECT a.id, a.username, a.email, a.role, a.is_active
      FROM admin_sessions s
      JOIN admin_users a ON a.id = s.admin_id
      WHERE s.token = ${token}
        AND s.expires_at > NOW()
        AND a.role = 'super_admin'
        AND a.is_active = true
      LIMIT 1
    `;

    if (rows.length === 0) {
      throw jsonResponse({ success: false, message: 'Session expired or not authorized' }, 401);
    }

    return rows[0];
  } catch (error) {
    if (error instanceof Response) throw error;
    throw jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
}

/**
 * Read the raw JSON body safely. Returns {} on empty/invalid bodies.
 */
export async function readJson(request: Request): Promise<any> {
  try {
    const raw = await request.text();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}