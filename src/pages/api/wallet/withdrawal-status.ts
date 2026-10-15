export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';
import { refundFailedPayout } from '@lib/payoutRefund';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

/** PayChangu operator ref IDs (fetched on demand). Caller caches per-user so a
 *  stuck payout can be attributed to a provider (Airtel vs TNM). */
async function getOperatorIdsForUser(userId: string): Promise<{ airtel: string; tnm: string; provider: 'airtel' | 'tnm' } | null> {
  const sql = client;
  const rows = await sql`SELECT operator_ref_id FROM withdrawals WHERE user_id = ${userId} ORDER BY requested_at DESC LIMIT 1`;
  if (rows.length > 0) {
    const ref = String(rows[0].operator_ref_id || '');
    if (ref) {
      return { airtel: '20be6c20-adeb-4b5b-a7ba-0769820df4fb', tnm: '27494cb5-ba9e-437f-a114-4e7a7686bcca', provider: ref.startsWith('20be6c20') ? 'airtel' : 'tnm' };
    }
  }
  return null;
}

async function pickOperator(operatorRefId: string): Promise<{ airtel: string; tnm: string; provider: 'airtel' | 'tnm' }> {
  const sql = client;
  const rows = await sql`SELECT operator_ref_id FROM withdrawals WHERE operator_ref_id = ${operatorRefId} ORDER BY requested_at DESC LIMIT 1`;
  if (rows.length > 0) {
    const ref = String(rows[0].operator_ref_id || '');
    if (ref) {
      return { airtel: '20be6c20-adeb-4b5b-a7ba-0769820df4fb', tnm: '27494cb5-ba9e-437f-a114-4e7a7686bcca', provider: ref.startsWith('20be6c20') ? 'airtel' : 'tnm' };
    }
  }
  return { airtel: '20be6c20-adeb-4b5b-a7ba-0769820df4fb', tnm: '27494cb5-ba9e-437f-a114-4e7a7686bcca', provider: 'airtel' };
}

/** Airtel operator ref id as cached by PayChangu / the app */
function isAirtelOperator(refId: string | null | undefined): boolean {
  return !!refId && String(refId).startsWith('20be6c20');
}

/** Airtel -> mobile money is currently having issues. When a payout sits stuck at
 *  'processing', tell the user to retry on TNM instead so nothing stays stuck. */
async function enrichStuckWithdrawal(
  w: any,
  sql: any,
  userId: string
): Promise<any> {
  const cached = await getOperatorIdsForUser(userId);
  let provider: 'airtel' | 'tnm' = 'airtel';
  let operatorRefId: string | null = null;
  if (cached) {
    provider = cached.provider;
    operatorRefId = cached.provider === 'airtel' ? cached.airtel : cached.tnm;
  } else {
    const m = await sql`SELECT operator_ref_id FROM withdrawals WHERE id = ${w.id} ORDER BY requested_at DESC LIMIT 1`;
    if (m.length > 0) {
      const ref = String(m[0].operator_ref_id || '');
      if (ref) {
        operatorRefId = ref;
        provider = isAirtelOperator(ref) ? 'airtel' : 'tnm';
      }
    }
  }

  if (provider === 'airtel' && w.status === 'processing' && w.payment_method === 'paychangu_mobile_money') {
    try {
      const verifyRes = await fetch(
        `https://api.paychangu.com/mobile-money/payments/${w.payment_reference}/verify`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
          },
        }
      );
      const verifyData = await verifyRes.json();
      const payoutStatus = verifyData?.data?.status || verifyData?.status;
      const msg = 'PayChangu is having trouble with your Airtel Mobile Money payout right now. Please try again — for this withdrawal, please use TNM Mpamba instead (gwiritsani nambala ina (tnm)).';
      return { ...w, operatorRefId, provider, operatorMessage: msg, stuckProviderNote: true };
    } catch (err) {
      console.error(`Airtel-to-TNM hint check failed for ${w.id}:`, err);
      return { ...w, operatorRefId, provider, stuckProviderNote: true };
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
      const enriched = await enrichStuckWithdrawal(w, sql, effectiveUserId);
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
