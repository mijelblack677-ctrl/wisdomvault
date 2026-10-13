export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const packId = url.searchParams.get('packId');

  if (!userId || !packId) {
    return new Response(JSON.stringify({ success: false, message: 'User ID and Pack ID required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const sql = client;

  try {
    // Check ownership
    const ownership = await sql`
      SELECT * FROM user_premium_packs WHERE user_id = ${userId} AND pack_id = ${packId}
    `;

    if (ownership.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'You do not own this pack. Purchase it first.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get pack details
    const pack = await sql`SELECT * FROM premium_packs WHERE id = ${packId}`;
    
    // Get pack items
    const items = await sql`
      SELECT * FROM premium_content_items WHERE pack_id = ${packId} ORDER BY display_order
    `;

    return new Response(JSON.stringify({
      success: true,
      pack: pack[0],
      items,
      purchasedAt: ownership[0].purchased_at,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
