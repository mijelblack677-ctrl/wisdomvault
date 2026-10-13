export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireAdmin, unauthorized } from '@lib/adminAuth';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

/**
 * POST /api/referral/approve  { userId }
 *
 * ADMIN-ONLY. Pays out pending first-level referral bonuses for a verified
 * user. This endpoint moves real money into referrer wallets, so it must
 * never be callable without an admin session — previously it was fully
 * open, which allowed anyone to mint bonuses. Requires an admin Bearer
 * token (admin_sessions) plus the referral to exist and be unpaid.
 */
export const POST: APIRoute = async ({ request }) => {
  const limit = checkRateLimit(`referral-approve:${clientIp(request)}`, 10, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const admin = await requireAdmin(request);
  if (!admin) return unauthorized('Admin authentication required');

  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'User ID required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Get all pending referrals where this user is the referred user
    const pendingReferrals = await sql`
      SELECT
        r.id as referral_id,
        r.referrer_id,
        r.bonus_amount,
        r.fee_deducted,
        r.net_amount,
        u.full_name as referrer_name
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      WHERE r.referred_id = ${userId}
        AND r.is_paid = false
        AND r.referral_type = 'first_level'
    `;

    if (pendingReferrals.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending referrals to approve',
        approved: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let approvedCount = 0;

    for (const referral of pendingReferrals) {
      const referrerId = referral.referrer_id;
      const bonusAmount = parseFloat(referral.bonus_amount);
      const feeDeducted = parseFloat(referral.fee_deducted);
      const netAmount = parseFloat(referral.net_amount);

      // Get referrer's wallet
      const walletResult = await sql`
        SELECT id, balance_available, gross_earnings, fees_paid
        FROM wallets WHERE user_id = ${referrerId}
      `;

      if (walletResult.length === 0) {
        console.error(`Wallet not found for referrer: ${referrerId}`);
        continue;
      }

      const wallet = walletResult[0];
      const currentBalance = parseFloat(wallet.balance_available);
      const currentGross = parseFloat(wallet.gross_earnings);
      const currentFees = parseFloat(wallet.fees_paid || 0);

      // Calculate fee based on the 6,000 chunk rule
      const chunkSize = 6000;
      const feePerChunk = 1000;

      const oldChunks = Math.floor(currentBalance / chunkSize);
      const newTotal = currentBalance + bonusAmount;
      const newChunks = Math.floor(newTotal / chunkSize);
      const actualFee = (newChunks - oldChunks) * feePerChunk;
      const actualNet = bonusAmount - actualFee;
      const newBalance = newTotal - actualFee;

      // Update referrer's wallet
      await sql`
        UPDATE wallets
        SET balance_available = ${newBalance},
            gross_earnings = ${currentGross + bonusAmount},
            fees_paid = ${currentFees + actualFee}
        WHERE id = ${wallet.id}
      `;

      // Mark referral as paid
      await sql`
        UPDATE referrals
        SET is_paid = true,
            fee_deducted = ${actualFee},
            net_amount = ${actualNet}
        WHERE id = ${referral.referral_id}
      `;

      // Record transaction
      await sql`
        INSERT INTO transactions (
          wallet_id,
          referral_id,
          transaction_type,
          amount,
          fee_deducted,
          balance_before,
          balance_after,
          description
        ) VALUES (
          ${wallet.id},
          ${referral.referral_id},
          'referral_bonus',
          ${bonusAmount},
          ${actualFee},
          ${currentBalance},
          ${newBalance},
          ${'Referral bonus for ' + referral.referrer_name + ' - Fee: ' + actualFee + ' MWK'}
        )
      `;

      // Create notification for referrer
      await sql`
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          link
        ) VALUES (
          ${referrerId},
          'referral_approved',
          '🎉 Referral Bonus Earned!',
          ${'Your referral bonus of MWK ' + actualNet.toLocaleString() + ' has been credited! The user has been verified.'},
          '/dashboard/invites'
        )
      `;

      approvedCount++;
    }

    // Audit trail: who approved the payout
    await sql`
      INSERT INTO audit_logs (admin_id, user_id, action, details)
      VALUES (${admin.id}, ${userId}, 'referral_approve',
              ${JSON.stringify({ approved: approvedCount })}::jsonb)
    `;

    return new Response(JSON.stringify({
      success: true,
      message: `Approved ${approvedCount} referral(s)`,
      approved: approvedCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Referral approval error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
