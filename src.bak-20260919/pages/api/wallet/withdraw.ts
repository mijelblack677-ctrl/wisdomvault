export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';
import { calculateWithdrawalFee, calculateNetPayout, getFeeBreakdown } from '@lib/feeCalculator';
import { refundFailedPayout } from '@lib/payoutRefund';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

/**
 * Normalize a Malawian phone number to comparable digits-only form:
 * strips spaces/dashes/+, optional leading 265 country code, and leading 0.
 * e.g. "+265 999 123 456", "0999123456" and "265999123456" all → "999123456".
 */
function normalizePhone(phone: string): string {
  let digits = (phone || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('265')) digits = digits.slice(3);
  return digits.replace(/^0+/, '');
}

// PayChangu operator ref IDs (fetched dynamically on first call, then cached)
let operatorCache: { airtel: string; tnm: string; fetchedAt: number } | null = null;
const OPERATOR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getOperatorIds(): Promise<{ airtel: string; tnm: string }> {
  if (operatorCache && (Date.now() - operatorCache.fetchedAt) < OPERATOR_CACHE_TTL) {
    return { airtel: operatorCache.airtel, tnm: operatorCache.tnm };
  }

  try {
    const res = await fetch('https://api.paychangu.com/mobile-money/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
      }
    });

    const data = await res.json();
    console.log('PayChangu operators:', JSON.stringify(data, null, 2));

    if (data.status === 'success' && data.data) {
      const operators = data.data;
      let airtel = '';
      let tnm = '';

      for (const op of operators) {
        const code = (op.short_code || '').toLowerCase();
        const name = (op.name || '').toLowerCase();
        if (code === 'airtel' || name.includes('airtel')) airtel = op.ref_id || '';
        if (code === 'tnm' || name.includes('tnm') || name.includes('mpamba')) tnm = op.ref_id || '';
      }

      if (airtel && tnm) {
        operatorCache = { airtel, tnm, fetchedAt: Date.now() };
        console.log(`✅ PayChangu operators cached: Airtel=${airtel}, TNM=${tnm}`);
        return { airtel, tnm };
      }
    }

    console.warn('⚠️ Could not fetch operators dynamically, using fallback IDs');
    return {
      airtel: '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
      tnm: '27494cb5-ba9e-437f-a114-4e7a7686bcca'
    };
  } catch (err) {
    console.error('Failed to fetch PayChangu operators:', err);
    return {
      airtel: '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
      tnm: '27494cb5-ba9e-437f-a114-4e7a7686bcca'
    };
  }
}

/**
 * Detect mobile money provider from phone number.
 * Numbers starting with 08 (or +2658) are TNM Mpamba;
 * numbers starting with 09 (or +2659) are Airtel Money.
 */
function detectProvider(phone: string): 'airtel' | 'tnm' {
  const clean = phone.replace(/[\s\-+]/g, '');
  const num = clean.startsWith('265') ? clean.substring(3) : clean;

  if (num.startsWith('08') || num.startsWith('8')) {
    return 'tnm';
  }
  if (num.startsWith('09') || num.startsWith('9')) {
    return 'airtel';
  }

  return 'airtel';
}

// ─────────────────────────────────────────────────────────────────────────
// PAYCHANGU PAYOUT OUTCOME RESOLUTION
//
// Refund SAFETY: money must never be refunded after a payout actually went
// through. PayChangu can reject a payout outright (validation errors, rate
// limits) — those never move money, so refunding is safe. But a network error,
// timeout, 5xx or unparseable body does NOT mean the payout failed: PayChangu
// may have accepted it and sent the money before the error surfaced. In those
// ambiguous cases we ask PayChangu's verify endpoint what actually happened
// and only refund when it proves no payout exists / it explicitly failed.
// ─────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ask PayChangu what actually happened to a payout charge.
 * ok=false means PayChangu was unreachable or returned something we can't
 * interpret — never use that to trigger a refund.
 */
async function verifyPayoutWithPayChangu(chargeId: string): Promise<{
  ok: boolean;
  status: 'success' | 'failed' | 'pending' | 'not_found' | 'unknown';
  message: string;
}> {
  try {
    const res = await fetch(
      `https://api.paychangu.com/mobile-money/payments/${chargeId}/verify`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
        },
      }
    );
    let data: any = {};
    try { data = await res.json(); } catch { data = {}; }

    const topOk = data.status === 'success' || data.status === 'successful';
    const message = String(data.message || data.detail || '');

    // Explicit "no such payout" (404 or a not-found message)
    if (res.status === 404 || /not found|does not exist|no (record|transaction|payout|charge)/i.test(message)) {
      return { ok: true, status: 'not_found', message };
    }

    const record = data.data;
    const hasRecord = record !== null && typeof record === 'object' && !Array.isArray(record);
    if (!topOk || !hasRecord) {
      return { ok: false, status: 'unknown', message };
    }

    const inner = String(record.status || '').toLowerCase();
    if (['success', 'successful', 'completed'].includes(inner)) {
      return { ok: true, status: 'success', message };
    }
    if (['failed', 'cancelled', 'expired', 'reversed', 'rejected'].includes(inner)) {
      return { ok: true, status: 'failed', message };
    }
    if (['pending', 'processing', 'queued'].includes(inner)) {
      return { ok: true, status: 'pending', message };
    }
    return { ok: true, status: 'unknown', message: `Unexpected payout status: ${inner}` };
  } catch (err) {
    return { ok: false, status: 'unknown', message: (err as Error).message };
  }
}

/**
 * Resolve the outcome of an ambiguous PayChangu payout initiation (network
 * error, 5xx, unreadable body — where we don't know if the payout was accepted).
 *
 * Verifies against PayChangu (with retries) and only refunds when it proves
 * the payout never happened. On PayChangu unreachable / uninterpretable: leaves
 * the row as 'processing' so the daily reconcile cron finalises it.
 */
async function resolveAmbiguousPayoutInit(
  sql: any,
  withdrawalId: string,
  chargeId: string
): Promise<{
  outcome: 'completed' | 'processing' | 'failed';
  refunded: boolean;
}> {
  const attempts = [0, 3000, 6000]; // immediate, +3s, +6s
  let last: { ok: boolean; status: string; message: string } = { ok: false, status: 'unknown', message: '' };
  let notFoundCount = 0;

  for (const delayMs of attempts) {
    if (delayMs) await sleep(delayMs);
    last = await verifyPayoutWithPayChangu(chargeId);

    if (last.status === 'success') {
      await sql`
        UPDATE withdrawals SET status = 'completed', processed_at = NOW(),
          notes = notes || ${' | Auto-reconciled after ambiguous init: PayChangu confirms payout success (charge ' + chargeId + ')'}
        WHERE id = ${withdrawalId}
      `;
      return { outcome: 'completed', refunded: false };
    }
    if (last.status === 'failed') {
      await refundFailedPayout(sql, withdrawalId,
        ' | PayChangu verify after ambiguous init: ' + (last.message || 'failed') + ' — AUTO REFUNDED');
      return { outcome: 'failed', refunded: true };
    }
    if (last.status === 'pending') {
      await sql`
        UPDATE withdrawals SET status = 'processing',
          notes = notes || ${' | Ambiguous init; PayChangu verify shows payout processing (charge ' + chargeId + ')'}
        WHERE id = ${withdrawalId}
      `;
      return { outcome: 'processing', refunded: false };
    }
    if (last.status === 'not_found') {
      notFoundCount++;
      continue; // retry to dodge eventual-consistency lag at PayChangu
    }
    // unknown / unreachable — keep trying
  }

  // Three consecutive not-found answers ~6 seconds apart means PayChangu
  // definitely has no record of this charge — the payout was never created
  // and no money moved.
  if (notFoundCount > 0 && last.status === 'not_found') {
    await refundFailedPayout(sql, withdrawalId,
      ' | PayChangu verify: no payout record after ambiguous init (' + notFoundCount + ' lookups) — AUTO REFUNDED');
    return { outcome: 'failed', refunded: true };
  }

  // PayChangu unreachable / uninterpretable — money may be in flight.
  // Leave as 'processing'; the reconcile cron finalises when reachable.
  return { outcome: 'processing', refunded: false };
}

function isDefinitiveRejection(httpStatus: number, data: any): boolean {
  if (httpStatus >= 400 && httpStatus < 500) return true; // incl 429 rate limit
  const s = String(data?.status || '').toLowerCase();
  return ['failed', 'error', 'failure', 'rejected', 'cancelled'].includes(s);
}

function isRateLimit(httpStatus: number, data: any): boolean {
  const msg = String(data?.message || data?.detail || '');
  return httpStatus === 429 || /rate limit|too many requests|throttl/i.test(msg);
}

/**
 * Get the withdrawal mode from platform_config.
 * 'manual' = admin approves payouts manually (no PayChangu API calls)
 * 'paychangu' = automatic payouts via PayChangu mobile money
 */
async function getWithdrawalMode(sql: any): Promise<string> {
  try {
    const mode = await sql`SELECT config_value FROM platform_config WHERE config_key = 'withdrawal_mode'`;
    return mode[0]?.config_value || 'manual';
  } catch {
    return 'manual';
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit per client IP before doing any work — this endpoint moves real
    // money and is a prime flood target. (Per-instance in-memory guard; pair it
    // with Vercel Firewall for an edge-level block on scripted traffic.)
    const limit = checkRateLimit(`withdraw:${clientIp(request)}`, 5, 60_000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSeconds);
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { userId: bodyUserId, amount, cardholderName, phoneNumber } = body;

    if (!amount) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Amount required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // ── SECURITY ────────────────────────────────────────────────────────
    // NEVER trust a client-supplied userId on its own: this endpoint moves
    // real money out of a wallet. Any attacker who learns another user's id
    // (ids appear in URLs / referral payloads) must not be able to drain that
    // user's balance to a phone number they control.
    //
    // Accepted authentication paths:
    //   1. A real session token (Authorization: Bearer …) — proves login.
    //   2. Legacy ?userId=/body userId — accepted ONLY when the requested
    //      payout phone matches the phone registered to that account, so a
    //      leaked userId alone can't redirect funds to an attacker's number.
    // ────────────────────────────────────────────────────────────────────
    let userId: string | null = null;

    const sessionUser = await getAuthUser(request);
    if (sessionUser) {
      // Real login (Bearer session): the session itself proves identity, so
      // the user may pay out to any number they currently own.
      userId = sessionUser.id;
    } else if (bodyUserId) {
      // Legacy path (no session token yet): only permit when the payout
      // destination equals the phone registered to that account. This stops
      // anyone who merely knows another user's id from redirecting that
      // user's funds to a number they control.
      const candidate = await sql`
        SELECT id, phone FROM users WHERE id = ${bodyUserId} AND is_active = true LIMIT 1
      `;
      if (candidate.length > 0) {
        const payoutDigits = normalizePhone(phoneNumber);
        const registeredDigits = normalizePhone(candidate[0].phone);
        if (payoutDigits && registeredDigits && payoutDigits === registeredDigits) {
          userId = bodyUserId;
        }
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized. Please sign in and try again.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check withdrawal mode — this determines the ENTIRE flow
    const withdrawalMode = await getWithdrawalMode(sql);

    // Check if user is verified
    const user = await sql`
      SELECT id, full_name, email, payment_status, phone
      FROM users WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'User not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (user[0].payment_status !== 'verified') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Your account must be verified before you can withdraw.'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid amount'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Lock wallet row inside transaction to prevent race conditions
    const wallets = await sql`SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE`;
    if (wallets.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Wallet not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const wallet = wallets[0];
    const currentBalance = parseFloat(wallet.balance_available);

    // Get minimum withdrawal amount from config (default 7,000)
    const minConfig = await sql`
      SELECT config_value FROM platform_config WHERE config_key = 'withdrawal_min_amount'
    `;
    const minWithdrawal = parseFloat(minConfig[0]?.config_value || '7000');

    if (withdrawalAmount < minWithdrawal) {
      return new Response(JSON.stringify({
        success: false,
        message: `Minimum withdrawal is MWK ${minWithdrawal.toLocaleString()}. Your balance: MWK ${currentBalance.toLocaleString()}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (withdrawalAmount > currentBalance) {
      return new Response(JSON.stringify({
        success: false,
        message: `Insufficient balance. You have MWK ${currentBalance.toLocaleString()} available.`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Idempotency: reject if user already has a processing/pending withdrawal.
    // SELF-HEAL: a PayChangu auto-withdrawal can get stuck on 'processing' even
    // though the money was actually sent (status sync never ran for that row).
    // Before blocking the user forever, ask PayChangu about it: if the payout is
    // confirmed sent, mark it completed and let the new withdrawal through.
    // Anything ambiguous keeps the existing (safe) block so we never double-pay.
    const existingActive = await sql`
      SELECT id, status, payment_method, payment_reference FROM withdrawals
      WHERE wallet_id = ${wallet.id}
        AND status IN ('pending', 'processing')
      ORDER BY requested_at DESC
      LIMIT 1
    `;

    if (existingActive.length > 0) {
      const stuck = existingActive[0];
      let resolvedStuck = false;

      if (stuck.status === 'processing' &&
          stuck.payment_method === 'paychangu_mobile_money' &&
          stuck.payment_reference) {
        try {
          const verifyRes = await fetch(
            `https://api.paychangu.com/mobile-money/payments/${stuck.payment_reference}/verify`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
              }
            }
          );
          const verifyData = await verifyRes.json();
          const topOk = verifyData.status === 'success' || verifyData.status === 'successful';
          const innerStatus = verifyData.data?.status;
          const hasRecord = verifyData.data !== null && typeof verifyData.data === 'object';

          if (topOk && hasRecord && ['success', 'successful', 'completed'].includes(innerStatus)) {
            // Money already reached the user — close the stuck row, no refund,
            // and allow the new withdrawal to proceed.
            await sql`
              UPDATE withdrawals
              SET status = 'completed', processed_at = NOW(),
                  notes = notes || ${' | Auto-reconciled: PayChangu confirms payout success (charge ' + stuck.payment_reference + ')'}
              WHERE id = ${stuck.id}
            `;
            await sql`
              INSERT INTO notifications (user_id, type, title, message, link)
              VALUES (${userId}, 'withdrawal_completed', '✅ Withdrawal Successful',
                ${`Your earlier withdrawal has been confirmed as sent to your mobile money wallet.`},
                '/dashboard/wallet')
            `;
            resolvedStuck = true;
            console.log(`✅ Self-healed stuck withdrawal ${stuck.id}: PayChangu confirms success, allowing new request`);
          }
        } catch (err) {
          console.error(`Self-heal verify failed for ${stuck.payment_reference}:`, err);
        }
      }

      if (!resolvedStuck) {
        return new Response(JSON.stringify({
          success: false,
          message: `You already have a ${stuck.status} withdrawal. Please wait for it to complete before requesting another.`
        }), { status: 409, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Calculate fee — pass mode so PayChangu offset only applies in auto mode
    const feeAmount = calculateWithdrawalFee(withdrawalAmount, withdrawalMode);
    const netPayout = calculateNetPayout(withdrawalAmount, withdrawalMode);
    const feeBreakdown = getFeeBreakdown(withdrawalAmount, withdrawalMode);

    const payoutPhone = phoneNumber || user[0].phone;
    const provider = detectProvider(payoutPhone);

    console.log(`💰 Withdrawal request:\n      User: ${user[0].full_name}\n      Amount: ${withdrawalAmount}\n      Fee: ${feeAmount} (${feeBreakdown.tier})\n      Net: ${netPayout}\n      Phone: ${payoutPhone}\n      Provider: ${provider}\n      Mode: ${withdrawalMode}\n    `);

    const chargeId = `WV-WD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // ═══════════════════════════════════════════════════════════════════
    // RATE LIMIT: Apply to BOTH modes (max 3 per hour per user)
    //
    // Only withdrawals that were actually initiated count toward the limit.
    // 'failed' and 'rejected' ones never sent money (the user was refunded), so
    // counting them would lock a user out for the hour after a string of
    // failures — blocking a legitimate retry of money they never received.
    // ═══════════════════════════════════════════════════════════════════
    const recentWithdrawals = await sql`
      SELECT COUNT(*) as count FROM withdrawals
      WHERE wallet_id = (SELECT id FROM wallets WHERE user_id = ${userId})
        AND requested_at > NOW() - INTERVAL '1 hour'
        AND status NOT IN ('failed', 'rejected')
    `;
    if (parseInt(recentWithdrawals[0].count) >= 3) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Rate limit: maximum 3 withdrawals per hour. Please try again later.'
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    // ═══════════════════════════════════════════════════════════════════
    // MANUAL MODE: Create pending withdrawal for admin approval ONLY
    // No PayChangu API calls. No automatic processing.
    // ═══════════════════════════════════════════════════════════════════
    if (withdrawalMode === 'manual') {
      const result = await sql.begin(async (tx: any) => {
        // Lock wallet row inside transaction to prevent race conditions
        const lockedWallet = await tx`SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE`;
        const lockedBalance = parseFloat(lockedWallet[0]?.balance_available || 0);

        // Re-check balance with lock held
        if (withdrawalAmount > lockedBalance) {
          throw new Error(`Insufficient balance. You have MWK ${lockedBalance.toLocaleString()} available.`);
        }

        // Create withdrawal record with 'pending' status and 'manual' method
        const withdrawalResult = await tx`
          INSERT INTO withdrawals (
            wallet_id, amount_requested, withdrawal_fee, amount_paid,
            status, payment_method, payment_reference, requested_at, notes
          ) VALUES (
            ${wallet.id}, ${withdrawalAmount}, ${feeAmount}, ${netPayout},
            'pending', 'manual', ${chargeId}, NOW(),
            ${`Name: ${cardholderName || user[0].full_name}, Phone: ${payoutPhone}, Provider: ${provider}. Fee: ${feeAmount} (${feeBreakdown.tier}: ${feeBreakdown.description}). Mode: manual`}
          )
          RETURNING id, requested_at
        `;

        // Deduct from wallet immediately (hold the funds)
        const newBalance = lockedBalance - withdrawalAmount;
        const newTotalWithdrawn = parseFloat(wallet.total_withdrawn || 0) + netPayout;
        const newFeesPaid = parseFloat(wallet.fees_paid || 0) + feeAmount;

        await tx`
          UPDATE wallets
          SET balance_available = ${newBalance},
              total_withdrawn = ${newTotalWithdrawn},
              fees_paid = ${newFeesPaid},
              updated_at = NOW()
          WHERE id = ${wallet.id}
        `;

        // Update user totals
        await tx`
          UPDATE users
          SET total_fees_paid = COALESCE(total_fees_paid, 0) + ${feeAmount},
              total_net_earnings = COALESCE(total_net_earnings, 0) - ${feeAmount}
          WHERE id = ${userId}
        `;

        // Record transaction
        await tx`
          INSERT INTO transactions (
            wallet_id, transaction_type, amount, fee_deducted, net_amount,
            balance_before, balance_after, description
          ) VALUES (
            ${wallet.id}, 'withdrawal', ${withdrawalAmount}, ${feeAmount}, ${netPayout},
            ${lockedBalance}, ${newBalance},
            ${`Withdrawal request: MWK ${netPayout.toLocaleString()} to ${payoutPhone} (${provider}) — awaiting admin approval (manual mode)`}
          )
        `;

        return {
          withdrawalId: withdrawalResult[0].id,
          requestedAt: withdrawalResult[0].requested_at,
          newBalance
        };
      });

      // Notify user
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'withdrawal_pending',
          '💸 Withdrawal Requested',
          ${`Your withdrawal of MWK ${netPayout.toLocaleString()} (fee: MWK ${feeAmount.toLocaleString()}) has been submitted. It will be reviewed by an admin shortly.`},
          '/dashboard/wallet')
      `;

      return new Response(JSON.stringify({
        success: true,
        message: `Withdrawal of MWK ${netPayout.toLocaleString()} requested. It will be reviewed and processed by an admin. You will be notified once it's approved.`,
        withdrawal: {
          id: result.withdrawalId,
          amountRequested: withdrawalAmount,
          fee: feeAmount,
          netPayout: netPayout,
          status: 'pending',
          paymentMethod: 'manual',
          provider: provider === 'airtel' ? 'Airtel Money' : 'TNM Mpamba',
          phone: payoutPhone,
          chargeId: chargeId,
          requestedAt: result.requestedAt
        },
        newBalance: result.newBalance
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PAYCHANGU MODE: Automatic payout via PayChangu API
    // No manual approval needed. If PayChangu fails, refund immediately.
    // ═══════════════════════════════════════════════════════════════════

    // Create withdrawal record with 'processing' status
    const result = await sql.begin(async (tx: any) => {
      // Lock wallet row inside transaction to prevent race conditions
      const lockedWallet = await tx`SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE`;
      const lockedBalance = parseFloat(lockedWallet[0]?.balance_available || 0);

      // Re-check balance with lock held
      if (withdrawalAmount > lockedBalance) {
        throw new Error(`Insufficient balance. You have MWK ${lockedBalance.toLocaleString()} available.`);
      }

      const withdrawalResult = await tx`
        INSERT INTO withdrawals (
          wallet_id, amount_requested, withdrawal_fee, amount_paid,
          status, payment_method, payment_reference, requested_at, notes
        ) VALUES (
          ${wallet.id}, ${withdrawalAmount}, ${feeAmount}, ${netPayout},
          'processing', 'paychangu_mobile_money', ${chargeId}, NOW(),
          ${`Name: ${cardholderName || user[0].full_name}, Phone: ${payoutPhone}, Provider: ${provider}. Fee: ${feeAmount} (${feeBreakdown.tier}: ${feeBreakdown.description}). Mode: paychangu`}
        )
        RETURNING id, requested_at
      `;

      // Deduct from wallet immediately
      const newBalance = lockedBalance - withdrawalAmount;
      const newTotalWithdrawn = parseFloat(wallet.total_withdrawn || 0) + netPayout;
      const newFeesPaid = parseFloat(wallet.fees_paid || 0) + feeAmount;

      await tx`
        UPDATE wallets
        SET balance_available = ${newBalance},
            total_withdrawn = ${newTotalWithdrawn},
            fees_paid = ${newFeesPaid},
            updated_at = NOW()
        WHERE id = ${wallet.id}
      `;

      await tx`
        UPDATE users
        SET total_fees_paid = COALESCE(total_fees_paid, 0) + ${feeAmount},
            total_net_earnings = COALESCE(total_net_earnings, 0) - ${feeAmount}
        WHERE id = ${userId}
      `;

      await tx`
        INSERT INTO transactions (
          wallet_id, transaction_type, amount, fee_deducted, net_amount,
          balance_before, balance_after, description
        ) VALUES (
          ${wallet.id}, 'withdrawal', ${withdrawalAmount}, ${feeAmount}, ${netPayout},
          ${lockedBalance}, ${newBalance},
          ${`Withdrawal via PayChangu: MWK ${netPayout.toLocaleString()} to ${payoutPhone} (${provider})`}
        )
      `;

      return {
        withdrawalId: withdrawalResult[0].id,
        requestedAt: withdrawalResult[0].requested_at,
        newBalance,
        payoutPhone,
        provider,
        chargeId
      };
    });

    // Now initiate PayChangu payout
    //
    // SAFETY: ambiguous outcomes (network error, 5xx, unreadable body) do NOT
    // mean the payout failed — PayChangu may have accepted and sent the money
    // before the error surfaced. On ambiguity we verify first and only refund
    // when PayChangu confirms the payout never happened.
    let payoutStatus = 'processing';
    let payoutMessage = 'Withdrawal submitted. Processing via PayChangu...';
    let payoutRefunded = false;
    let payoutRateLimited = false;
    let responseBalance = result.newBalance;

    const providerLabel = provider === 'airtel' ? 'Airtel Money' : 'TNM Mpamba';
    const netStr = netPayout.toLocaleString();

    /** Helper to apply the result of resolveAmbiguousPayoutInit and build
     *  the user-facing message. Defined once to avoid duplicating message
     *  text in try/catch.
     */
    const applyResolution = async (res: {
      outcome: 'completed' | 'processing' | 'failed';
      refunded: boolean;
    }) => {
      payoutStatus = res.outcome;
      payoutRefunded = res.refunded;
      if (res.refunded) {
        const balAfter = await sql`SELECT balance_available FROM wallets WHERE id = ${wallet.id}`;
        responseBalance = parseFloat(balAfter[0]?.balance_available || responseBalance);
      }
      if (res.outcome === 'completed') {
        payoutMessage = `Your withdrawal of MWK ${netStr} has been sent to ${payoutPhone} via ${providerLabel}.`;
      } else if (res.outcome === 'failed') {
        payoutMessage = `Something went wrong while processing your withdrawal of MWK ${netStr}. The full amount has been refunded to your balance. Please try again later.`;
      } else {
        payoutMessage = `Your withdrawal of MWK ${netStr} was submitted, but we couldn't confirm its status right now. If it was not delivered, the full amount will be refunded to your balance automatically.`;
      }
    };

    try {
      const operators = await getOperatorIds();
      const operatorRefId = provider === 'airtel' ? operators.airtel : operators.tnm;

      console.log(`📤 Initiating PayChangu payout: ${netPayout} MWK to ${payoutPhone} via ${provider}`);

      const payoutResponse = await fetch('https://api.paychangu.com/mobile-money/payouts/initialize', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
        },
        body: JSON.stringify({
          mobile_money_operator_ref_id: operatorRefId,
          mobile: payoutPhone.replace(/[\s\-]/g, ''),
          amount: netPayout.toString(),
          charge_id: result.chargeId,
          email: user[0].email,
          first_name: (user[0].full_name || '').split(' ')[0],
          last_name: (user[0].full_name || '').split(' ').slice(1).join(' ')
        })
      });

      // Read body as text first so a non-JSON response (empty / HTML error page)
      // doesn't crash into the catch and get treated as a network error.
      const httpStatus = payoutResponse.status;
      const rawBody = await payoutResponse.text();
      let payoutData: any = {};
      try { payoutData = rawBody ? JSON.parse(rawBody) : {}; } catch { payoutData = {}; }
      console.log('PayChangu payout response (HTTP', httpStatus + '):', JSON.stringify(payoutData, null, 2));

      const txData = payoutData.data?.transaction || payoutData.data || {};
      const initDataStatus = txData.status;
      const topInitOk = ['success', 'successful', 'pending'].includes(payoutData.status);
      const payoutNotesExtra = ' | PayChangu charge_id: ' + result.chargeId + ', trans_id: ' + (txData.trans_id || '') + ', mobile: ' + (txData.mobile || '');

      // PayChangu can settle a payout instantly (data.status already 'success')
      // or accept it for async settlement (data.status 'pending'). When it has
      // already succeeded we mark the withdrawal 'completed' right away so the
      // dashboard shows ✅ and the row never gets stuck on 'processing' (which
      // previously made admins think it failed and refund a paid-out user).
      if (topInitOk && ['success', 'successful', 'completed'].includes(initDataStatus)) {
        payoutStatus = 'completed';
        payoutMessage = `Your withdrawal of MWK ${netStr} has been sent to ${payoutPhone} via ${providerLabel}.`;

        await sql`
          UPDATE withdrawals
          SET status = 'completed', processed_at = NOW(),
              notes = notes || ${payoutNotesExtra}
          WHERE id = ${result.withdrawalId}
        `;
      } else if (topInitOk) {
        // status is 'pending' — PayChangu accepted the payout, processing async.
        payoutStatus = 'processing';
        payoutMessage = `Withdrawal of MWK ${netStr} is being sent to ${payoutPhone} via ${providerLabel}. You should receive it within minutes.`;

        await sql`
          UPDATE withdrawals
          SET status = 'processing', notes = notes || ${payoutNotesExtra}
          WHERE id = ${result.withdrawalId}
        `;
      } else if (isDefinitiveRejection(httpStatus, payoutData)) {
        // PayChangu definitively rejected the request (HTTP 4xx incl. 429 rate
        // limit, or an explicit 'failed'/'error'/'rejected' status body). No
        // payout was created → money never moved → safe to refund immediately.
        const reason = isRateLimit(httpStatus, payoutData)
          ? 'PayChangu rate limit (HTTP ' + httpStatus + ')' + (payoutData.message ? ': ' + payoutData.message : '')
          : 'PayChangu rejected payout: ' + (payoutData.message || 'HTTP ' + httpStatus);
        console.error('PayChangu payout rejected:', reason);
        await refundFailedPayout(sql, result.withdrawalId, ' | ' + reason + ' — AUTO REFUNDED');

        payoutStatus = 'failed';
        payoutRefunded = true;
        payoutRateLimited = isRateLimit(httpStatus, payoutData);
        const balAfter = await sql`SELECT balance_available FROM wallets WHERE id = ${wallet.id}`;
        responseBalance = parseFloat(balAfter[0]?.balance_available || responseBalance);
        payoutMessage = payoutRateLimited
          ? `PayChangu is receiving too many requests right now (rate limit), so your withdrawal of MWK ${netStr} could not be processed. The full amount has been refunded to your balance. Please try again later.`
          : `Something went wrong while processing your withdrawal of MWK ${netStr}: ${payoutData.message || 'the payment processor rejected the request'}. The full amount has been refunded to your balance. Please try again later.`;
      } else {
        // AMBIGUOUS — HTTP 5xx, unrecognised shape, non-JSON body etc.
        // The payout may have been accepted despite the error. Verify first;
        // never refund a confirmed-success payout.
        console.warn('PayChangu payout ambiguous (HTTP', httpStatus + ', body:', rawBody.substring(0, 200) + ') — verifying...');
        await applyResolution(await resolveAmbiguousPayoutInit(sql, result.withdrawalId, result.chargeId));
      }
    } catch (payoutErr) {
      console.error('PayChangu payout error (ambiguous — verifying):', payoutErr);
      // Network error / timeout — the request may or may not have reached
      // PayChangu. Verify first; only refund when PayChangu proves no record.
      await applyResolution(await resolveAmbiguousPayoutInit(sql, result.withdrawalId, result.chargeId));
    }

    // Notify user
    await sql`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (${userId}, ${'withdrawal_' + payoutStatus},
        ${payoutStatus === 'completed' ? '✅ Withdrawal Successful' : payoutStatus === 'processing' ? '💸 Withdrawal Processing' : '❌ Withdrawal Failed'},
        ${payoutMessage}, '/dashboard/wallet')
    `;

    // HTTP 200 for handled failures (refunded) so the client never retries a
    // money-move POST. HTTP 201 for success/processing. User-caught errors
    // (insufficient balance, etc.) still use 400/401/404 as before.
    return new Response(JSON.stringify({
      success: payoutStatus !== 'failed',
      message: payoutMessage,
      refunded: payoutRefunded,
      rateLimited: payoutRateLimited,
      withdrawal: {
        id: result.withdrawalId,
        amountRequested: withdrawalAmount,
        fee: feeAmount,
        netPayout: netPayout,
        status: payoutStatus,
        paymentMethod: 'paychangu_mobile_money',
        provider: providerLabel,
        phone: result.payoutPhone,
        chargeId: result.chargeId,
        requestedAt: result.requestedAt
      },
      newBalance: responseBalance
    }), {
      status: payoutStatus === 'failed' ? 200 : 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Withdrawal error:', err);
    const isUserError = err.message.includes('Insufficient balance') || err.message.includes('already have');
    return new Response(JSON.stringify({
      success: false,
      message: err.message || 'Withdrawal failed. Please try again.'
    }), {
      status: isUserError ? 400 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
