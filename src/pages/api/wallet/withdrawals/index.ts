export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';

// ============================================================
// GET - Get user's withdrawal history
// ============================================================
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User ID required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!(await isAuthorizedUser(request, userId))) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Unauthorized' 
      }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Get user's wallet
    const wallet = await sql`
      SELECT id FROM wallets WHERE user_id = ${userId}
    `;

    if (wallet.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        withdrawals: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user's withdrawals
    const withdrawals = await sql`
      SELECT 
        id,
        amount_requested,
        withdrawal_fee,
        amount_paid,
        status,
        payment_method,
        payment_reference,
        notes,
        requested_at,
        processed_at
      FROM withdrawals
      WHERE wallet_id = ${wallet[0].id}
      ORDER BY requested_at DESC
    `;

    return new Response(JSON.stringify({
      success: true,
      withdrawals: withdrawals.map((w: any) => ({
        id: w.id,
        amountRequested: parseFloat(w.amount_requested || 0),
        withdrawalFee: parseFloat(w.withdrawal_fee || 0),
        amountPaid: parseFloat(w.amount_paid || 0),
        status: w.status,
        paymentMethod: w.payment_method,
        paymentReference: w.payment_reference,
        notes: w.notes,
        requestedAt: w.requested_at,
        processedAt: w.processed_at
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('User withdrawals GET error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
