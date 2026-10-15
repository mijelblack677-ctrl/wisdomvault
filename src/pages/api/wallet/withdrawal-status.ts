export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';
import { refundFailedPayout } from '@lib/payoutRefund';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

/** Detect the mobile-money provider from the withdrawal's notes field.
 *  withdraw.ts writes "… Provider: airtel|tnm …" into notes; the withdrawals
 *  table has no operator_ref_id column, so we parse notes instead. Returns
 *  null when the provider cannot be determined. Never throws. */
function detectProviderFromNotes(notes: string | null | undefined): 'airtel' | 'tnm' | null {
  if (!notes) return null;
  const m = String(notes).match(/Provider:\s*(airtel|tnm)/i);
  if (m) return m[1].toLowerCase() as 'airtel' | 'tnm';
  // Fallback: raw mentions in free-text notes
  if (/airtel/i.test(String(notes))) return 'airtel';
  if (/tnm|mpamba/i.test(String(notes))) return 'tnm';
  return null;
}

/** Airtel -> mobile money is currently having issues. When a payout sits stuck at
 *  'processing', tell the user to retry on TNM instead so nothing stays stuck. */
async function enrichStuckWithdrawal(w: any): Promise<any> {
  // Only stuck paychangu mobile-money payouts need extra handling; everything
  // else returns untouched (matches the pre-regression behaviour).
  if (!(w.status === 'processing' && w.payment_method === 'paychangu_mobile_money')) {
    return w;
  }

  const provider = detectProviderFromNotes(w.notes);

  if (provider === 'airtel') {
    try {
      await fetch(
        `https://api.paychangu.com/mobile-money/payments/${w.payment_reference}/verify`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
          },
        }
      );
      const msg = 'PayChangu is having trouble with your Airtel Mobile Money payout right now. Please try again — for this withdrawal, please use TNM Mpamba instead (gwiritsani nambala ina (tnm)).';
      return { ...w, provider, operatorMessage: msg, stuckProviderNote: true };
    } catch (err) {
      console.error(`Airtel-to-TNM hint check failed for ${w.id}:`, err);
      return { ...w, provider, stuckProviderNote: true };
    }
  }
  return w;
}

/** GET /api/wallet/withdrawal-status?userId=xxx&withdrawalId=xxx
 * Checks the status of a withdrawal by querying PayChangu API. For stuck
 * 'processing' payouts on Airtel, also tells the user to try TNM. */
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
      const enriched = await enrichStuckWithdrawal(w);
      results.push(enriched);
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
