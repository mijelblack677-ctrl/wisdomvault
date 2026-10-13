export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireAdmin, unauthorized } from '@lib/adminAuth';

// ADMIN-ONLY: this endpoint returns raw premium_content_items including
// file_url for ANY pack id — it must never be callable anonymously.
export const GET: APIRoute = async ({ request }) => {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const url = new URL(request.url);
    const packId = url.searchParams.get('packId');

    if (!packId) {
      return new Response(JSON.stringify({ success: false, message: 'packId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    const items = await sql`
      SELECT id, title, content_type, file_url, link_type, display_order
      FROM premium_content_items
      WHERE pack_id = ${packId}
      ORDER BY display_order, created_at, id
    `;

    return new Response(JSON.stringify({ success: true, items: items || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Items API error:', err);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
