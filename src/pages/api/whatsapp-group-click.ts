export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const sql = client;
  try {
    // Same paywall as the groups endpoint: only verified users can record clicks.
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const paid = await sql`
      SELECT 1 FROM users
      WHERE id = ${user.id} AND is_active = TRUE AND payment_status = 'verified'
      LIMIT 1
    `;
    if (paid.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Payment required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const groupId = Number(body.groupId);
    if (!Number.isInteger(groupId)) {
      return new Response(JSON.stringify({ success: false, message: 'Valid groupId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Group must exist and be active (no counting clicks for hidden groups).
    const group = await sql`SELECT id FROM whatsapp_groups WHERE id = ${groupId} AND is_active = TRUE LIMIT 1`;
    if (group.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Group not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // One row per user/group/day — repeat clicks just refresh the timestamp.
    try {
      await sql`
        INSERT INTO whatsapp_group_clicks (group_id, user_id, click_day)
        VALUES (${groupId}, ${user.id}::uuid, CURRENT_DATE)
        ON CONFLICT (group_id, user_id, click_day)
        DO UPDATE SET clicked_at = NOW()
      `;
    } catch {
      // Dedupe conflicts are fine; analytics must never block the popup flow.
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Analytics must never break the popup flow — swallow and report OK.
    const err = error as Error;
    console.error('whatsapp-groups click error:', err);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
