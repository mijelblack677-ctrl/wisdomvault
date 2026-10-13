export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireVaultPro, jsonResponse, readJson } from '@lib/vaultproAuth';
import bcrypt from 'bcryptjs';

/**
 * PUT /api/vaultpro/admins/:id
 * Body: { is_active?, role?, password? }
 */
export const PUT: APIRoute = async ({ request }) => {
  try {
    const actor = await requireVaultPro(request);
    const sql = client;

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop() || '';

    if (!id) {
      return jsonResponse({ success: false, message: 'admin id required' }, 400);
    }

    const body = await readJson(request);
    const existing = await sql`SELECT id, username, email, role, is_active FROM admin_users WHERE id = ${id}`;
    if (existing.length === 0) {
      return jsonResponse({ success: false, message: 'Admin not found' }, 404);
    }
    const admin = existing[0];

    const updates: string[] = [];
    const values: any[] = [];

    if (body.is_active !== undefined) {
      // Prevent the last super_admin from deactivating themselves / locking out the panel
      if (admin.role === 'super_admin' && body.is_active === false && actor.id === admin.id) {
        return jsonResponse({ success: false, message: 'You cannot deactivate your own account' }, 400);
      }
      updates.push('is_active = $' + (updates.length + 1));
      values.push(body.is_active);
    }

    if (body.role !== undefined) {
      const allowedRoles = ['super_admin', 'admin', 'content_manager', 'support'];
      if (!allowedRoles.includes(body.role)) {
        return jsonResponse({ success: false, message: 'Invalid role' }, 400);
      }
      // Prevent demoting your own account away from super_admin
      if (actor.id === admin.id && admin.role === 'super_admin' && body.role !== 'super_admin') {
        return jsonResponse({ success: false, message: 'You cannot demote your own account' }, 400);
      }
      updates.push('role = $' + (updates.length + 1));
      values.push(body.role);
    }

    if (body.password) {
      if (body.password.length < 6) {
        return jsonResponse({ success: false, message: 'Password must be at least 6 characters' }, 400);
      }
      const passwordHash = await bcrypt.hash(body.password, 10);
      updates.push('password_hash = $' + (updates.length + 1));
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return jsonResponse({ success: false, message: 'Nothing to update' }, 400);
    }

    values.push(id);
    await sql.unsafe(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${actor.id}, 'vaultpro_update_admin',
              ${JSON.stringify({ adminId: id, updates: updates.join(', ') })}::jsonb)
    `;

    const refreshed = await sql`
      SELECT id, username, email, role, is_active FROM admin_users WHERE id = ${id}
    `;

    return jsonResponse({ success: true, message: 'Admin updated', admin: refreshed[0] });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};