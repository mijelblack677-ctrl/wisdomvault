export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    const userResult = await sql`
      SELECT payment_status FROM users WHERE id = ${userId}
    `;

    if (userResult.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      paymentStatus: userResult[0].payment_status || 'pending'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Payment status error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message,
      error: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
