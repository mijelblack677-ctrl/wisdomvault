import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import { t as refundFailedPayout } from "./payoutRefund_DRftL3TD.mjs";
import { t as getAuthUser } from "./auth_Cqxo1lyi.mjs";
//#region src/pages/api/wallet/withdrawal-status.ts
var withdrawal_status_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
/**
* GET /api/wallet/withdrawal-status?userId=xxx&withdrawalId=xxx
* 
* Checks the status of a withdrawal by querying PayChangu API.
* Updates the withdrawal record in the database.
*/
var GET = async ({ request }) => {
	try {
		const limit = checkRateLimit(`withdrawal-status:${clientIp(request)}`, 40, 6e4);
		if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
		const withdrawalId = new URL(request.url).searchParams.get("withdrawalId");
		const sessionUser = await getAuthUser(request);
		const authUserId = sessionUser ? sessionUser.id : null;
		if (!authUserId) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const effectiveUserId = authUserId;
		let withdrawals;
		if (withdrawalId) withdrawals = await sql`
        SELECT w.*, wal.user_id
        FROM withdrawals w
        JOIN wallets wal ON w.wallet_id = wal.id
        WHERE w.id = ${withdrawalId} AND wal.user_id = ${effectiveUserId}
      `;
		else withdrawals = await sql`
        SELECT w.*, wal.user_id
        FROM withdrawals w
        JOIN wallets wal ON w.wallet_id = wal.id
        WHERE wal.user_id = ${effectiveUserId}
        ORDER BY w.requested_at DESC
        LIMIT 10
      `;
		if (!withdrawals || withdrawals.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "No withdrawals found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const results = [];
		for (const w of withdrawals) {
			let currentStatus = w.status;
			if (w.status === "processing" && w.payment_reference) try {
				const verifyData = await (await fetch(`https://api.paychangu.com/mobile-money/payments/${w.payment_reference}/verify`, {
					method: "GET",
					headers: {
						"Accept": "application/json",
						"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
					}
				})).json();
				console.log(`PayChangu verify for ${w.payment_reference}:`, JSON.stringify(verifyData, null, 2));
				const topLevelOk = verifyData.status === "success" || verifyData.status === "successful";
				const payoutStatus = verifyData.data?.status;
				const hasRecord = verifyData && verifyData.data !== null && typeof verifyData.data === "object";
				const statusFailed = [
					"failed",
					"cancelled",
					"expired",
					"reversed"
				].includes(payoutStatus);
				const statusSuccess = [
					"success",
					"successful",
					"completed"
				].includes(payoutStatus);
				if (topLevelOk && hasRecord && statusSuccess) {
					currentStatus = "completed";
					await sql`
              UPDATE withdrawals SET status = 'completed', processed_at = NOW(),
                notes = notes || ${" | PayChangu verify: success (trans_id: " + (verifyData.data?.trans_id || "") + ")"}
              WHERE id = ${w.id}
            `;
					await sql`
              INSERT INTO notifications (user_id, type, title, message, link)
              VALUES (${w.user_id}, 'withdrawal_completed', '✅ Withdrawal Successful',
                ${`Your withdrawal of MWK ${parseFloat(w.amount_paid || 0).toLocaleString()} has been sent to your mobile money wallet.`},
                '/dashboard/wallet')
            `;
				} else if (topLevelOk && hasRecord && statusFailed) {
					currentStatus = "failed";
					await refundFailedPayout(sql, w.id, " | PayChangu verify: " + (payoutStatus || verifyData.status || "failed") + " — AUTO REFUNDED");
					await sql`
              INSERT INTO notifications (user_id, type, title, message, link)
              VALUES (${w.user_id}, 'withdrawal_failed', '❌ Withdrawal Failed',
                ${`Your withdrawal of MWK ${parseFloat(w.amount_requested || 0).toLocaleString()} could not be sent by the payment processor. The full amount has been refunded to your wallet balance.`},
                '/dashboard/wallet')
            `;
				} else console.warn(`PayChangu verify for ${w.payment_reference} unresolved (${verifyData.status || "no status"}, data=${verifyData.data === null ? "null" : typeof verifyData.data}) — leaving as processing, no refund`);
			} catch (err) {
				console.error(`Failed to verify withdrawal ${w.payment_reference}:`, err);
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
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Withdrawal status error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/wallet/withdrawal-status@_@ts
var page = () => withdrawal_status_exports;
//#endregion
export { page };
