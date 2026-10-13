export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';
import { refundFailedPayout } from '@lib/payoutRefund';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

/**
 * GET /api/wallet/withdrawal-status?userId=xxx&withdrawalId=xxx
 * 
 * Checks the status of a withdrawal by querying PayChangu API.
 * Updates the withdrawal record in the database.
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Rate limit per client IP: each hit on a 'processing' withdrawal triggers
    // a PayChangu verify fetch, so a poll flood burns real CPU per request.
    const limit = checkRateLimit(`withdrawal-status:${clientIp(request)}`, 40, 60_000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSeconds);
    }

    const url = new URL(request.url);
    const withdrawalId = url.searchParams.get('withdrawalId');

    // ── SECURITY ──────────────────────────────────────────────────────
    // Session token only (legacy ?userId= fallback removed — it let anyone
    // with a discovered user id query another user's withdrawals).
    // ──────────────────────────────────────────────────────────────────
    const sessionUser = await getAuthUser(request);
    const authUserId: string | null = sessionUser ? sessionUser.id : null;

    if (!authUserId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;
    const effectiveUserId = authUserId;

    // Get withdrawal(s) — always scoped to the authenticated user
    let withdrawals;
    if (withdrawalId) {
      withdrawals = await sql`
        SELECT w.*, wal.user_id
        FROM withdrawals w
        JOIN wallets wal ON w.wallet_id = wal.id
        WHERE w.id = ${withdrawalId} AND wal.user_id = ${effectiveUserId}
      `;
    } else {
      withdrawals = await sql`
        SELECT w.*, wal.user_id
        FROM withdrawals w
        JOIN wallets wal ON w.wallet_id = wal.id
        WHERE wal.user_id = ${effectiveUserId}
        ORDER BY w.requested_at DESC
        LIMIT 10
      `;
    }

    if (!withdrawals || withdrawals.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No withdrawals found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For processing withdrawals, check PayChangu status
    const results = [];
    for (const w of withdrawals) {
      let currentStatus = w.status;

      if (w.status === 'processing' && w.payment_reference) {
        // Query PayChangu for status
        try {
          const verifyRes = await fetch(
            `https://api.paychangu.com/mobile-money/payments/${w.payment_reference}/verify`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
              }
            }
          );

          const verifyData = await verifyRes.json();
          console.log(`PayChangu verify for ${w.payment_reference}:`, JSON.stringify(verifyData, null, 2));

          // ⚠️ REFUND SAFETY: successful payouts that got stuck on 'processing'
          // must NEVER be auto-refunded because a verify lookup failed or came
          // back ambiguous (that's how users end up paid twice). We only treat a
          // payout as failed — and refund it — when PayChangu returns an actual
          // transaction record whose status explicitly says it failed.
          const topLevelOk = verifyData.status === 'success' || verifyData.status === 'successful';
          const payoutStatus = verifyData.data?.status;
          // A real record exists when verifyData.data is a non-null object
          const hasRecord = verifyData && verifyData.data !== null && typeof verifyData.data === 'object';
          const statusFailed = ['failed', 'cancelled', 'expired', 'reversed'].includes(payoutStatus);
          const statusSuccess = ['success', 'successful', 'completed'].includes(payoutStatus);

          if (topLevelOk && hasRecord && statusSuccess) {
            currentStatus = 'completed';
            await sql`
              UPDATE withdrawals SET status = 'completed', processed_at = NOW(),
                notes = notes || ${' | PayChangu verify: success (trans_id: ' + (verifyData.data?.trans_id || '') + ')'}
              WHERE id = ${w.id}
            `;

            // Notify the user (same convention as the other completed paths)
            await sql`
              INSERT INTO notifications (user_id, type, title, message, link)
              VALUES (${w.user_id}, 'withdrawal_completed', '✅ Withdrawal Successful',
                ${`Your withdrawal of MWK ${parseFloat(w.amount_paid || 0).toLocaleString()} has been sent to your mobile money wallet.`},
                '/dashboard/wallet')
            `;
          } else if (topLevelOk && hasRecord && statusFailed) {
            // PayChangu returned an actual record that explicitly failed — safe to refund
            currentStatus = 'failed';
            await refundFailedPayout(sql, w.id,
              ' | PayChangu verify: ' + (payoutStatus || verifyData.status || 'failed') + ' — AUTO REFUNDED');
            await sql`
              INSERT INTO notifications (user_id, type, title, message, link)
              VALUES (${w.user_id}, 'withdrawal_failed', '❌ Withdrawal Failed',
                ${`Your withdrawal of MWK ${parseFloat(w.amount_requested || 0).toLocaleString()} could not be sent by the payment processor. The full amount has been refunded to your wallet balance.`},
                '/dashboard/wallet')
            `;
          } else {
            // Charge not found / lookup failed / still pending — the money may
            // well have been sent. Leave it as 'processing'; never refund here.
            console.warn(`PayChangu verify for ${w.payment_reference} unresolved (${verifyData.status || 'no status'}, data=${verifyData.data === null ? 'null' : typeof verifyData.data}) — leaving as processing, no refund`);
          }
        } catch (err) {
          console.error(`Failed to verify withdrawal ${w.payment_reference}:`, err);
        }
      }

      results.push({
        id: w.id,
        amountRequested: parseFloat(w.amount_requested || 0),
        fee: parseFloat(w.withdrawal_fee || 0),
        netPayout: parseFloat(w.amount_paid || 0),
        status: currentStatus,
        paymentMethod: w.payment_method,
        chargeId: w.payment_reference,
        requestedAt: w.requested_at,
        processedAt: w.processed_at
      });
    }

    return new Response(JSON.stringify({
      success: true,
      withdrawals: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Withdrawal status error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
