export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';

export const GET: APIRoute = async ({ request }) => {
  const sql = client;
  try {
    // Popup is for paying members only: require a valid session AND a
    // verified payment status. Unauthenticated or pending users get 403.
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

    const groups = await sql`
      SELECT id, name, description, link, sort_order, updated_at
      FROM whatsapp_groups
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, id ASC
    `;
    return new Response(
      JSON.stringify({ success: true, groups: groups || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const err = error as Error;
    console.error('whatsapp-groups GET error:', err);
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
