import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import { t as getAuthUser } from "./auth_Cqxo1lyi.mjs";
import { i as paychanguVerifyPayment, n as markTransactionFailed, r as markTransactionVerified, t as autoVerifyUser } from "./paychangu_BMOpIrdQ.mjs";
//#region src/pages/api/paychangu/status.ts
var status_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
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
var GET = async ({ request }) => {
	try {
		const limit = checkRateLimit(`paychangu-status:${clientIp(request)}`, 40, 6e4);
		if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
		const txRefParam = new URL(request.url).searchParams.get("tx_ref");
		const sessionUser = await getAuthUser(request);
		const userId = sessionUser ? sessionUser.id : null;
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const paymentStatus = (await sql`
      SELECT payment_status FROM users WHERE id = ${userId}
    `)[0]?.payment_status || "pending";
		if (paymentStatus === "verified") return new Response(JSON.stringify({
			success: true,
			paymentStatus: "verified",
			verified: true,
			txStatus: "success"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
		const pendingTxns = await sql`
      SELECT pt.*
      FROM paychangu_transactions pt
      WHERE pt.user_id = ${userId}
        AND pt.status = 'pending'
      ORDER BY pt.created_at DESC
    `;
		const candidates = txRefParam ? pendingTxns.filter((t) => t.tx_ref === txRefParam) : pendingTxns;
		if (candidates.length === 0) return new Response(JSON.stringify({
			success: true,
			paymentStatus,
			verified: false,
			txStatus: "none",
			message: "No pending PayChangu transaction found for this account."
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
		let verified = false;
		let lastTxStatus = "pending";
		for (const tx of candidates) {
			const txRef = tx.tx_ref;
			const { verifyData, confirmedPaid, stillPending, explicitlyFailed, paymentData } = await paychanguVerifyPayment(txRef).catch((err) => {
				console.error(`PayChangu status re-check failed for ${txRef}:`, err);
				return {
					verifyData: null,
					confirmedPaid: false,
					stillPending: true,
					explicitlyFailed: false,
					paymentData: null
				};
			});
			if (confirmedPaid && paymentData) {
				const expectedAmount = parseFloat(tx.amount);
				const paidAmount = parseFloat(paymentData.amount);
				if (paidAmount >= expectedAmount) {
					await markTransactionVerified(sql, txRef, paymentData);
					await autoVerifyUser(sql, userId, txRef, paidAmount);
					verified = true;
					lastTxStatus = "success";
					break;
				} else {
					console.error(`❌ Amount mismatch on ${txRef}: expected ${expectedAmount}, got ${paidAmount}`);
					lastTxStatus = "amount_mismatch";
				}
			} else if (stillPending) lastTxStatus = "pending";
			else if (explicitlyFailed) {
				await markTransactionFailed(sql, txRef, verifyData);
				lastTxStatus = "failed";
			}
		}
		const finalStatus = (await sql`
      SELECT payment_status FROM users WHERE id = ${userId}
    `)[0]?.payment_status || "pending";
		return new Response(JSON.stringify({
			success: true,
			paymentStatus: finalStatus,
			verified: finalStatus === "verified" || verified,
			txStatus: verified ? "success" : lastTxStatus,
			message: verified ? "Payment confirmed! Your account is now active." : "Payment is still being processed by PayChangu. Please check again shortly."
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("PayChangu status error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message || "Failed to check payment status"
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/paychangu/status@_@ts
var page = () => status_exports;
//#endregion
export { page };
