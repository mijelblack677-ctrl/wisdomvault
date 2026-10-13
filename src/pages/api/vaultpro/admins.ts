export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireVaultPro, jsonResponse, readJson } from '@lib/vaultproAuth';
import bcrypt from 'bcryptjs';

/**
 * GET  /api/vaultpro/admins                  → list all admin accounts
 * POST /api/vaultpro/admins                  → create admin { username, email, password, role? }
 *
 * PUT /api/vaultpro/admins/:id lives in admins/[id].ts
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requireVaultPro(request);
    const sql = client;

    const admins = await sql`
      SELECT id, username, email, role, is_active, last_login, created_at
      FROM admin_users
      ORDER BY created_at ASC
    `;

    return jsonResponse({ success: true, admins });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const actor = await requireVaultPro(request);
    const sql = client;
    const body = await readJson(request);

    const { username, email, password, role } = body;
    if (!username || !email || !password) {
      return jsonResponse({ success: false, message: 'username, email and password required' }, 400);
    }
    if (password.length < 6) {
      return jsonResponse({ success: false, message: 'Password must be at least 6 characters' }, 400);
    }

    const allowedRoles = ['super_admin', 'admin', 'content_manager', 'support'];
    const finalRole = allowedRoles.includes(role) ? role : 'admin';

    const dup = await sql`
      SELECT id FROM admin_users WHERE username = ${username} OR email = ${email}
    `;
    if (dup.length > 0) {
      return jsonResponse({ success: false, message: 'Username or email already in use' }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const inserted = await sql`
      INSERT INTO admin_users (username, email, password_hash, role, is_active, created_at)
      VALUES (${username}, ${email}, ${passwordHash}, ${finalRole}, true, NOW())
      RETURNING id, username, email, role, is_active
    `;

    await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${actor.id}, 'vaultpro_create_admin',
              ${JSON.stringify({ username, email, role: finalRole })}::jsonb)
    `;

    return jsonResponse({ success: true, message: 'Admin created', admin: inserted[0] }, 201);
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};