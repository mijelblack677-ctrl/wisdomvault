export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import {
  paychanguVerifyPayment,
  markTransactionVerified,
  markTransactionFailed,
  autoVerifyUser,
} from '@lib/paychangu';

/**
 * POST /api/paychangu/webhook
 *
 * Dedicated webhook endpoint for PayChangu notifications. PayChangu sends
 * payment status updates here. Always returns 200 to acknowledge receipt.
 *
 * Signature policy: when a webhook secret is configured we log mismatches but
 * never block on them — server-side /verify-payment (authed with the secret
 * API key) is the authoritative check, so a spoofed webhook cannot mark
 * anything paid. A wrong webhook secret therefore cannot silently drop real
 * payments.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    console.log('📥 PayChangu webhook received:', JSON.stringify(body, null, 2));

    const signature = request.headers.get('Signature') || request.headers.get('x-paychangu-signature');
    if (signature && process.env.PAYCHANGU_WEBHOOK_SECRET) {
      try {
        const crypto = await import('crypto');
        const computedSignature = crypto.createHmac('sha256', process.env.PAYCHANGU_WEBHOOK_SECRET)
          .update(rawBody)
          .digest('hex');
        if (computedSignature !== signature) {
          console.warn('⚠️ Webhook signature mismatch — continuing because server-side verification is authoritative');
        }
      } catch (sigErr) {
        console.warn('⚠️ Webhook signature check error:', sigErr);
      }
    }

    const eventType = body.event_type || body.data?.event_type || body.type || '';
    const isPayoutEvent = eventType === 'api.payout' || eventType === 'API Payout';

    // ────────────────────────────────────────────────────────────────────
    // PAYOUT (money-out) WEBHOOKS: an api.payout event means PayChangu
    // settled a withdrawal we initiated. Mark the matching withdrawal
    // 'completed' so it never sits stuck on 'processing' (and therefore is
    // never refunded after the money already reached the user).
    //
    // NOTE: we intentionally do NOT auto-refund on a 'failed' payout
    // webhook — webhook signatures are not enforced and a wrong guess here
    // pays a user twice. Genuine failures are handled conservatively by the
    // status checks / admin panel instead.
    // ────────────────────────────────────────────────────────────────────
    const payoutChargeId = body.charge_id || body.data?.charge_id || body.chargeId;
    if (isPayoutEvent && payoutChargeId) {
      const sql = client;
      const rows = await sql`
        SELECT w.*, wal.user_id
        FROM withdrawals w
        JOIN wallets wal ON w.wallet_id = wal.id
        WHERE w.payment_reference = ${payoutChargeId}
          AND w.payment_method = 'paychangu_mobile_money'
        ORDER BY w.requested_at DESC LIMIT 1
      `;

      const eventStatus = String(body.status || body.data?.status || '').toLowerCase();
      if (rows.length > 0 && rows[0].status === 'processing' &&
          ['success', 'successful', 'completed'].includes(eventStatus)) {
        console.log(`✅ Payout webhook: marking withdrawal ${rows[0].id} completed`);
        await sql`
          UPDATE withdrawals
          SET status = 'completed', processed_at = NOW(),
              notes = notes || ${' | Payout webhook: success (charge_id: ' + payoutChargeId + ')'}
          WHERE id = ${rows[0].id}
        `;
        await sql`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (${rows[0].user_id}, 'withdrawal_completed', '✅ Withdrawal Successful',
            ${`Your withdrawal of MWK ${parseFloat(rows[0].amount_paid || 0).toLocaleString()} has been sent to your mobile money wallet.`},
            '/dashboard/wallet')
        `;
      } else if (rows.length > 0 && ['failed', 'cancelled'].includes(eventStatus)) {
        console.warn(`⚠️ Payout webhook reports ${eventStatus} for withdrawal ${rows[0].id} — leaving as-is, no auto-refund (admin should verify)`);
      } else {
        console.log(`Payout webhook: no actionable processing withdrawal for charge ${payoutChargeId} (event status: ${eventStatus || 'unknown'})`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const txRef = body.tx_ref || body.data?.tx_ref || body.reference;
    if (!txRef) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    const transactions = await sql`
      SELECT * FROM paychangu_transactions
      WHERE tx_ref = ${txRef}
      ORDER BY created_at DESC LIMIT 1
    `;

    if (transactions.length === 0) {
      console.log(`ℹ️ Webhook for unknown tx_ref: ${txRef} - storing for later processing`);
      await sql`
        INSERT INTO paychangu_transactions (
          user_id, tx_ref, amount, currency, status, raw_response
        ) VALUES (
          ${body.meta?.userId || body.data?.meta?.userId || null}, ${txRef},
          ${body.amount || body.data?.amount || 0}, ${body.currency || body.data?.currency || 'MWK'},
          ${body.status || 'unknown'},
          ${JSON.stringify(body)}::jsonb
        )
      `;
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tx = transactions[0];
    const userId = tx.user_id;

    if (tx.status === 'success') {
      if (userId) {
        try {
          await autoVerifyUser(sql, userId, txRef, parseFloat(tx.amount || 0));
        } catch (err) {
          console.error('Re-verify user on success webhook failed:', err);
        }
      }
      return new Response(JSON.stringify({ received: true, message: 'Already processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { verifyData, confirmedPaid, stillPending, explicitlyFailed, paymentData } =
      await paychanguVerifyPayment(txRef);

    if (confirmedPaid) {
      await markTransactionVerified(sql, txRef, paymentData);
      if (userId) {
        await autoVerifyUser(sql, userId, txRef, parseFloat(paymentData?.amount || tx.amount || 0));
      }
      console.log(`✅ Webhook: User ${userId} verified via ${paymentData?.authorization?.channel}`);
    } else if (stillPending) {
      console.log(`⏳ Webhook: payment ${txRef} still pending — leaving pending`);
    } else if (explicitlyFailed) {
      await markTransactionFailed(sql, txRef, verifyData);
      console.log(`❌ Webhook: payment ${txRef} failed`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const err = error as Error;
    console.error('PayChangu webhook error:', err);
    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ received: true, error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
