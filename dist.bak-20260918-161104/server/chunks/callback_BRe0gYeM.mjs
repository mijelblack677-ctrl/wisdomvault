import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { i as paychanguVerifyPayment, n as markTransactionFailed, r as markTransactionVerified, t as autoVerifyUser } from "./paychangu_BMOpIrdQ.mjs";
//#region src/pages/api/paychangu/callback.ts
var callback_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
/**
* GET /api/paychangu/callback?tx_ref=xxx&status=success
*
* PayChangu redirects the customer's browser here after payment. We
* re-verify server-side and auto-verify the user account when paid.
*
* IMPORTANT: a payment that is still "pending" at PayChangu (mobile-money
* settlement can lag) is NOT a failure. We leave it pending and send the
* customer to a "checking" screen instead of falsely marking it failed.
*/
var GET = async ({ request, redirect }) => {
	try {
		const url = new URL(request.url);
		const txRef = url.searchParams.get("tx_ref");
		const status = url.searchParams.get("status");
		console.log(`📥 PayChangu callback received: tx_ref=${txRef}, status=${status}`);
		if (!txRef) return redirect("/billing?status=error&message=missing_tx_ref");
		const sql = client;
		const transactions = await sql`
      SELECT * FROM paychangu_transactions
      WHERE tx_ref = ${txRef}
      ORDER BY created_at DESC LIMIT 1
    `;
		if (transactions.length === 0) {
			console.error(`❌ Transaction not found: ${txRef}`);
			return redirect("/billing?status=error&message=transaction_not_found");
		}
		const tx = transactions[0];
		const userId = tx.user_id;
		if (tx.status === "success") {
			if (userId) try {
				await autoVerifyUser(sql, userId, txRef, parseFloat(tx.amount || 0));
			} catch (err) {
				console.error("Re-verify user on already-success callback failed:", err);
			}
			return redirect("/dashboard?status=verified");
		}
		const { verifyData, confirmedPaid, stillPending, explicitlyFailed, paymentData } = await paychanguVerifyPayment(txRef);
		console.log("PayChangu verify response:", JSON.stringify(verifyData, null, 2));
		if (confirmedPaid) {
			const expectedAmount = parseFloat(tx.amount);
			const paidAmount = parseFloat(paymentData?.amount || expectedAmount);
			if (paidAmount < expectedAmount) {
				console.error(`❌ Amount mismatch: expected ${expectedAmount}, got ${paidAmount}`);
				return redirect("/billing?status=error&message=amount_mismatch");
			}
			await markTransactionVerified(sql, txRef, paymentData);
			if (userId) await autoVerifyUser(sql, userId, txRef, paidAmount);
			return redirect("/dashboard?status=verified&welcome=true");
		}
		if (stillPending) {
			console.log(`⏳ Payment ${txRef} still pending at PayChangu — keeping pending`);
			return redirect(`/billing?status=checking&tx_ref=${txRef}`);
		}
		if (explicitlyFailed) {
			await markTransactionFailed(sql, txRef, verifyData);
			console.log(`❌ Payment ${txRef} failed per PayChangu`);
			return redirect("/billing?status=failed&message=payment_not_successful");
		}
		console.log(`❓ Unknown verify state for ${txRef}:`, JSON.stringify(verifyData));
		return redirect(`/billing?status=checking&tx_ref=${txRef}`);
	} catch (error) {
		const err = error;
		console.error("PayChangu callback error:", err);
		return redirect(`/billing?status=error&message=${encodeURIComponent(err.message)}`);
	}
};
/**
* POST /api/paychangu/callback
*
* Webhook handler. PayChangu sends payment notifications here. We check the
* HMAC signature when a webhook secret is configured, but never block solely
* on a mismatch — the server-side /verify-payment re-query (which requires the
* API secret key) is the authoritative gate, so a spoofed webhook cannot mark
* anything paid. This also means a misconfigured webhook secret can never
* silently drop real payments.
*/
var POST = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const body = JSON.parse(rawBody);
		console.log("📥 PayChangu webhook received:", JSON.stringify(body, null, 2));
		const signature = request.headers.get("Signature") || request.headers.get("x-paychangu-signature");
		if (signature && process.env.PAYCHANGU_WEBHOOK_SECRET) try {
			if ((await import("crypto")).createHmac("sha256", process.env.PAYCHANGU_WEBHOOK_SECRET).update(rawBody).digest("hex") !== signature) console.warn("⚠️ Webhook signature mismatch — continuing because server-side verification is authoritative");
		} catch (sigErr) {
			console.warn("⚠️ Webhook signature check error:", sigErr);
		}
		const txRef = body.tx_ref || body.data?.tx_ref || body.reference;
		if (!txRef) return new Response(JSON.stringify({ received: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const transactions = await sql`
      SELECT * FROM paychangu_transactions
      WHERE tx_ref = ${txRef}
      ORDER BY created_at DESC LIMIT 1
    `;
		if (transactions.length === 0) {
			console.log(`ℹ️ Webhook for unknown tx_ref: ${txRef}`);
			return new Response(JSON.stringify({ received: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		const tx = transactions[0];
		const userId = tx.user_id;
		if (tx.status === "success") {
			if (userId) try {
				await autoVerifyUser(sql, userId, txRef, parseFloat(tx.amount || 0));
			} catch (err) {
				console.error("Re-verify user on success webhook failed:", err);
			}
			return new Response(JSON.stringify({
				received: true,
				message: "Already processed"
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		const { verifyData, confirmedPaid, stillPending, explicitlyFailed, paymentData } = await paychanguVerifyPayment(txRef);
		if (confirmedPaid) {
			await markTransactionVerified(sql, txRef, paymentData);
			if (userId) await autoVerifyUser(sql, userId, txRef, parseFloat(paymentData?.amount || tx.amount || 0));
			console.log(`✅ Webhook: user ${userId} verified via ${paymentData?.authorization?.channel}`);
		} else if (stillPending) console.log(`⏳ Webhook: payment ${txRef} still pending — leaving pending`);
		else if (explicitlyFailed) {
			await markTransactionFailed(sql, txRef, verifyData);
			console.log(`❌ Webhook: payment ${txRef} failed`);
		}
		return new Response(JSON.stringify({ received: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("PayChangu webhook error:", err);
		return new Response(JSON.stringify({
			received: true,
			error: err.message
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/paychangu/callback@_@ts
var page = () => callback_exports;
//#endregion
export { page };
