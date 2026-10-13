export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { userId, packId } = body;

    if (!userId || !packId) {
      return new Response(JSON.stringify({ success: false, message: 'User ID and Pack ID required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the session token belongs to the claimed user
    if (!(await isAuthorizedUser(request, userId))) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Check if already owned
    const existing = await sql`SELECT id FROM user_premium_packs WHERE user_id = ${userId} AND pack_id = ${packId}`;
    if (existing.length > 0) {
      return new Response(JSON.stringify({ success: false, message: 'You already own this pack' }), {
        status: 409, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get pack
    const pack = await sql`SELECT * FROM premium_packs WHERE id = ${packId} AND is_active = true`;
    if (pack.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Pack not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Purchase
    await sql`
      INSERT INTO user_premium_packs (user_id, pack_id, amount_paid, transaction_ref)
      VALUES (${userId}, ${packId}, ${pack[0].price}, ${'manual-' + Date.now()})
    `;

    return new Response(JSON.stringify({
      success: true,
      message: `Unlocked: ${pack[0].name}`,
      pack: { id: pack[0].id, name: pack[0].name, price: parseFloat(pack[0].price) },
    }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
