export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { userId, packId, providerName, phoneNumber, cardName, amountSent } = body;

    if (!userId || !packId || !providerName || !phoneNumber || !amountSent) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'All fields are required: provider name, phone number, and amount sent' 
      }), {
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

    // Check if already submitted
    const existing = await sql`
      SELECT id, status FROM payment_proofs 
      WHERE user_id = ${userId} AND pack_id = ${packId}
      ORDER BY created_at DESC LIMIT 1
    `;

    if (existing.length > 0) {
      if (existing[0].status === 'pending') {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'You already have a pending payment for this pack. Please wait for admin approval.' 
        }), {
          status: 409, headers: { 'Content-Type': 'application/json' }
        });
      }
      if (existing[0].status === 'approved') {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'You already own this pack.' 
        }), {
          status: 409, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if already owns the pack
    const ownership = await sql`
      SELECT id FROM user_premium_packs WHERE user_id = ${userId} AND pack_id = ${packId}
    `;
    if (ownership.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'You already own this pack.' 
      }), {
        status: 409, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get pack details
    const pack = await sql`SELECT name, price FROM premium_packs WHERE id = ${packId} AND is_active = true`;
    if (pack.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Pack not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Submit payment proof
    await sql`
      INSERT INTO payment_proofs (user_id, pack_id, provider_name, phone_number, card_name, amount_sent)
      VALUES (${userId}, ${packId}, ${providerName}, ${phoneNumber}, ${cardName || ''}, ${parseFloat(amountSent)})
    `;

    return new Response(JSON.stringify({
      success: true,
      message: `Payment proof submitted for "${pack[0].name}". Waiting for admin approval. You'll be notified when approved.`,
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
