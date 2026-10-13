export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';
import {
  paychanguVerifyPayment,
  markTransactionVerified,
  markTransactionFailed,
  autoVerifyUser,
} from '@lib/paychangu';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

/**
 * GET /api/paychangu/status?userId=xxx[&tx_ref=xxx]
 *
 * Reconciliation / "I already paid, why is my account not active?" endpoint.
 *
 * If a user's account is not yet verified and they have a pending PayChangu
 * checkout, this re-queries PayChangu server-side and:
 *   - payment confirmed   → marks tx success + auto-verifies the user
 *   - payment still pending → leaves pending, returns current status
 *   - payment failed      → marks tx failed
 *
 * Also powers the billing page's auto-refresh after a PayChangu redirect so a
 * mobile-money settlement lag can never strand a paid customer on "pending".
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Polled by dashboards/billing pages, so keep the per-IP ceiling generous;
    // still stops a scripted flood from re-querying PayChangu hundreds of
    // times a minute (each hit can trigger a server-side verify fetch).
    const limit = checkRateLimit(`paychangu-status:${clientIp(request)}`, 40, 60_000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSeconds);
    }

    const url = new URL(request.url);
    const txRefParam = url.searchParams.get('tx_ref');

    // Authenticate via session token only (legacy ?userId= fallback removed).
    const sessionUser = await getAuthUser(request);
    const userId: string | null = sessionUser ? sessionUser.id : null;

    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Current payment status
    const userRes = await sql`
      SELECT payment_status FROM users WHERE id = ${userId}
    `;
    const paymentStatus = userRes[0]?.payment_status || 'pending';

    // Already verified — nothing to do
    if (paymentStatus === 'verified') {
      return new Response(JSON.stringify({
        success: true,
        paymentStatus: 'verified',
        verified: true,
        txStatus: 'success'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the user's pending PayChangu transaction(s)
    const pendingTxns = await sql`
      SELECT pt.*
      FROM paychangu_transactions pt
      WHERE pt.user_id = ${userId}
        AND pt.status = 'pending'
      ORDER BY pt.created_at DESC
    `;

    const candidates = txRefParam
      ? pendingTxns.filter((t: any) => t.tx_ref === txRefParam)
      : pendingTxns;

    if (candidates.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        paymentStatus,
        verified: false,
        txStatus: 'none',
        message: 'No pending PayChangu transaction found for this account.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Re-check each pending tx against PayChangu (newest first). If any is
    // confirmed paid, verify the account and stop.
    let verified = false;
    let lastTxStatus = 'pending';

    for (const tx of candidates) {
      const txRef = tx.tx_ref;
      const { verifyData, confirmedPaid, stillPending, explicitlyFailed, paymentData } =
        await paychanguVerifyPayment(txRef).catch((err: Error) => {
          console.error(`PayChangu status re-check failed for ${txRef}:`, err);
          return {
            verifyData: null,
            confirmedPaid: false,
            stillPending: true,
            explicitlyFailed: false,
            paymentData: null,
          };
        });

      if (confirmedPaid && paymentData) {
        const expectedAmount = parseFloat(tx.amount);
        const paidAmount = parseFloat(paymentData.amount);
        if (paidAmount >= expectedAmount) {
          await markTransactionVerified(sql, txRef, paymentData);
          await autoVerifyUser(sql, userId, txRef, paidAmount);
          verified = true;
          lastTxStatus = 'success';
          break;
        } else {
          console.error(`❌ Amount mismatch on ${txRef}: expected ${expectedAmount}, got ${paidAmount}`);
          lastTxStatus = 'amount_mismatch';
        }
      } else if (stillPending) {
        lastTxStatus = 'pending';
      } else if (explicitlyFailed) {
        await markTransactionFailed(sql, txRef, verifyData);
        lastTxStatus = 'failed';
      }
    }

    // Re-read status after possible verification
    const finalRes = await sql`
      SELECT payment_status FROM users WHERE id = ${userId}
    `;
    const finalStatus = finalRes[0]?.payment_status || 'pending';

    return new Response(JSON.stringify({
      success: true,
      paymentStatus: finalStatus,
      verified: finalStatus === 'verified' || verified,
      txStatus: verified ? 'success' : lastTxStatus,
      message: verified
        ? 'Payment confirmed! Your account is now active.'
        : 'Payment is still being processed by PayChangu. Please check again shortly.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const err = error as Error;
    console.error('PayChangu status error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message || 'Failed to check payment status'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
