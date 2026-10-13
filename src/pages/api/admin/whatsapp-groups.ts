export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireVaultPro, jsonResponse } from '@lib/vaultproAuth';

const sql = client;

// Only allow WhatsApp invite links — blocks stray/abusive URLs.
function validLink(link: string): boolean {
  try {
    const u = new URL(link);
    return (
      u.protocol === 'https:' &&
      (u.hostname === 'chat.whatsapp.com' || u.hostname === 'wa.me') &&
      u.pathname.length > 1
    );
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ request }) => {
  try {
    await requireVaultPro(request);
  } catch (e) {
    return e as Response;
  }

  const groups = await sql`
    SELECT g.*,
           (SELECT COUNT(*) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS total_clicks,
           (SELECT COUNT(DISTINCT c.user_id) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS unique_users
    FROM whatsapp_groups g
    ORDER BY g.sort_order ASC, g.id ASC
  `;
  return jsonResponse({ success: true, groups });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireVaultPro(request);
  } catch (e) {
    return e as Response;
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const link = String(body.link || '').trim();
  const sort_order = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;

  if (!name || !validLink(link)) {
    return jsonResponse({ success: false, message: 'Name and a valid https://chat.whatsapp.com link are required' }, 400);
  }

  await sql`
    INSERT INTO whatsapp_groups (name, description, link, sort_order)
    VALUES (${name}, ${description}, ${link}, ${sort_order})
  `;
  const groups = await sql`
    SELECT g.*, 0 AS total_clicks, 0 AS unique_users FROM whatsapp_groups g
    WHERE id = (SELECT MAX(id) FROM whatsapp_groups)
  `;
  return jsonResponse({ success: true, groups }, 201);
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    await requireVaultPro(request);
  } catch (e) {
    return e as Response;
  }

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) {
    return jsonResponse({ success: false, message: 'Valid id required' }, 400);
  }
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const link = String(body.link || '').trim();
  if (!name || !validLink(link)) {
    return jsonResponse({ success: false, message: 'Name and a valid https://chat.whatsapp.com link are required' }, 400);
  }

  // Touching a group bumps updated_at → dashboard popup re-shows for everyone.
  await sql`
    UPDATE whatsapp_groups
    SET name = ${name}, description = ${description}, link = ${link},
        sort_order = ${Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0},
        is_active = ${body.is_active === false ? false : true},
        updated_at = NOW()
    WHERE id = ${id}
  `;
  const groups = await sql`
    SELECT g.*,
           (SELECT COUNT(*) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS total_clicks,
           (SELECT COUNT(DISTINCT c.user_id) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS unique_users
    FROM whatsapp_groups g ORDER BY g.sort_order ASC, g.id ASC
  `;
  return jsonResponse({ success: true, groups });
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    await requireVaultPro(request);
  } catch (e) {
    return e as Response;
  }

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) {
    return jsonResponse({ success: false, message: 'Valid id required' }, 400);
  }
  await sql`DELETE FROM whatsapp_groups WHERE id = ${id}`;
  const groups = await sql`
    SELECT g.*,
           (SELECT COUNT(*) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS total_clicks,
           (SELECT COUNT(DISTINCT c.user_id) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS unique_users
    FROM whatsapp_groups g ORDER BY g.sort_order ASC, g.id ASC
  `;
  return jsonResponse({ success: true, groups });
};
