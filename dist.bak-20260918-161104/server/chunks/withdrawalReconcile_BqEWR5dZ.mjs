import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { t as refundFailedPayout } from "./payoutRefund_DRftL3TD.mjs";
//#region src/lib/withdrawalReconcile.ts
/**
* Reconcile stuck 'processing' PayChangu auto-withdrawals against PayChangu's
* own records.
*
* Why this exists: when a payout is initiated PayChangu usually returns
* `data.status: 'pending'` (async settlement), so the row is left as
* 'processing'. Reconciling it to 'completed' used to depend on the user
* opening their wallet panel, the dashboard modal polling, a webhook arriving,
* or an admin clicking "Money Sent". If none of those happened, the row sat at
* 'processing' forever even though the money reached the user — and it then
* blocked that user's next withdrawal ("You already have a processing
* withdrawal").
*
* SAFETY: we only mark a payout 'completed' when PayChangu returns an actual
* transaction record whose status explicitly says success. Anything ambiguous
* (not found / lookup error / null data) is left as 'processing' — never
* refunded, because the money may well have been sent. Only an explicit
* 'failed' record triggers a refund (matching the withdrawal-status path).
*
* Idempotent: rows already completed/failed are skipped, so this can run on a
* schedule or be triggered from multiple places safely.
*/
async function reconcileStuckWithdrawals() {
	const sql = client;
	const stuck = await sql`
    SELECT w.*, wal.user_id
    FROM withdrawals w
    JOIN wallets wal ON w.wallet_id = wal.id
    WHERE w.status = 'processing'
      AND w.payment_method = 'paychangu_mobile_money'
      AND w.payment_reference IS NOT NULL
      AND w.requested_at < NOW() - INTERVAL '2 minutes'
    ORDER BY w.requested_at
  `;
	const summary = {
		checked: 0,
		completed: 0,
		failed: 0,
		leftProcessing: 0,
		errors: 0
	};
	for (const w of stuck) {
		summary.checked++;
		try {
			const verifyRes = await fetch(`https://api.paychangu.com/mobile-money/payments/${w.payment_reference}/verify`, {
				method: "GET",
				headers: {
					"Accept": "application/json",
					"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
				}
			});
			const verifyData = await verifyRes.json();
			const topLevelOk = verifyData.status === "success" || verifyData.status === "successful";
			const payoutStatus = verifyData.data?.status;
			const hasRecord = verifyData && verifyData.data !== null && typeof verifyData.data === "object";
			const statusSuccess = [
				"success",
				"successful",
				"completed"
			].includes(payoutStatus);
			const statusFailed = [
				"failed",
				"cancelled",
				"expired",
				"reversed"
			].includes(payoutStatus);
			if (topLevelOk && hasRecord && statusSuccess) {
				await sql`
          UPDATE withdrawals SET status = 'completed', processed_at = NOW(),
            notes = notes || ${" | Auto-reconciled: PayChangu confirms payout success (trans_id: " + (verifyData.data?.trans_id || "") + ")"}
          WHERE id = ${w.id}
        `;
				await sql`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (${w.user_id}, 'withdrawal_completed', '✅ Withdrawal Successful',
            ${`Your withdrawal of MWK ${parseFloat(w.amount_paid || 0).toLocaleString()} has been confirmed as sent to your mobile money wallet.`},
            '/dashboard/wallet')
        `;
				summary.completed++;
			} else if (topLevelOk && hasRecord && statusFailed) {
				await refundFailedPayout(sql, w.id, " | PayChangu verify: " + (payoutStatus || verifyData.status || "failed") + " — AUTO REFUNDED");
				await sql`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (${w.user_id}, 'withdrawal_failed', '❌ Withdrawal Failed',
            ${`Your withdrawal of MWK ${parseFloat(w.amount_requested || 0).toLocaleString()} could not be sent by the payment processor. The full amount has been refunded to your wallet balance.`},
            '/dashboard/wallet')
        `;
				summary.failed++;
			} else {
				const confirmedGone = verifyRes.status === 404 || /not found|does not exist|no (record|transaction|payout|charge)/i.test(String(verifyData.message || ""));
				const minutesOld = (Date.now() - new Date(w.requested_at).getTime()) / 6e4;
				if (confirmedGone && minutesOld >= 60) {
					await refundFailedPayout(sql, w.id, " | PayChangu verify: no payout record after " + Math.round(minutesOld) + " min — AUTO REFUNDED");
					await sql`
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (${w.user_id}, 'withdrawal_failed', '❌ Withdrawal Failed',
              ${`Your withdrawal of MWK ${parseFloat(w.amount_requested || 0).toLocaleString()} could not be confirmed by the payment processor. The full amount has been refunded to your wallet balance.`},
              '/dashboard/wallet')
          `;
					summary.failed++;
				} else {
					console.warn(`Reconcile: ${w.payment_reference} unresolved (${verifyData.status || "no status"}, data=${verifyData.data === null ? "null" : typeof verifyData.data}, confirmedGone=${confirmedGone}, minutesOld=${Math.round(minutesOld)}) — leaving as processing, no refund`);
					summary.leftProcessing++;
				}
			}
		} catch (err) {
			summary.errors++;
			console.error(`Reconcile verify failed for ${w.payment_reference}:`, err);
		}
	}
	if (summary.checked > 0) console.log(`Reconcile sweep: checked=${summary.checked} completed=${summary.completed} failed=${summary.failed} left=${summary.leftProcessing} errors=${summary.errors}`);
	return summary;
}
//#endregion
export { reconcileStuckWithdrawals as t };
