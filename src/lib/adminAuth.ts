// src/lib/adminAuth.ts
// Shared authentication for /api/admin/* endpoints.
// Validates the Authorization: Bearer token against the admin_sessions table.
import { client } from './db/connection';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export function unauthorized(message = 'Unauthorized'): Response {
  return new Response(JSON.stringify({ success: false, message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Validate the request's Bearer token as an active admin session.
 * Returns the admin row, or null when missing/expired/inactive.
 */
export async function requireAdmin(request: Request): Promise<AdminUser | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    const rows = await sql`
      SELECT a.id, a.username, a.email, a.role
      FROM admin_sessions s
      JOIN admin_users a ON a.id = s.admin_id
      WHERE s.token = ${token}
        AND s.expires_at > NOW()
        AND a.is_active = true
      LIMIT 1
    `;
    return rows.length > 0 ? (rows[0] as AdminUser) : null;
  } catch (error) {
    console.error('Admin auth error:', error);
    return null;
  }
}
