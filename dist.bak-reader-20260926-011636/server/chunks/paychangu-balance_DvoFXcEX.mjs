import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/admin/paychangu-balance.ts
var paychangu_balance_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
/**
* GET /api/admin/paychangu-balance
* 
* Returns PayChangu wallet balance + platform payout statistics.
* Requires admin authentication.
*/
var GET = async ({ request }) => {
	try {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const token = authHeader.replace("Bearer ", "");
		const sql = client;
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		let paychanguBalance = null;
		let paychanguError = null;
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 1e4);
			const res = await fetch("https://api.paychangu.com/wallet-balance?currency=MWK", {
				method: "GET",
				headers: {
					"Accept": "application/json",
					"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
				},
				signal: controller.signal
			});
			clearTimeout(timeout);
			const data = await res.json();
			console.log("PayChangu balance response:", JSON.stringify(data, null, 2));
			if (data.status === "success" && data.data) paychanguBalance = {
				environment: data.data.environment || "unknown",
				currency: data.data.currency || "MWK",
				mainBalance: parseFloat(data.data.main_balance || "0"),
				collectionBalance: parseFloat(data.data.collection_balance || "0"),
				totalBalance: parseFloat(data.data.main_balance || "0") + parseFloat(data.data.collection_balance || "0")
			};
			else paychanguError = data.message || "Failed to fetch balance";
		} catch (err) {
			if (err.name === "AbortError") paychanguError = "PayChangu API timeout - try again later";
			else paychanguError = err.message || "Connection failed";
			console.error("PayChangu balance fetch error:", paychanguError);
		}
		const withdrawalStats = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount_requested), 0) as total_requested,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(withdrawal_fee), 0) as total_fees
      FROM withdrawals
      GROUP BY status
    `;
		const totalPending = withdrawalStats.find((s) => s.status === "pending");
		const totalProcessing = withdrawalStats.find((s) => s.status === "processing");
		const totalCompleted = withdrawalStats.find((s) => s.status === "completed");
		const totalFailed = withdrawalStats.find((s) => s.status === "failed");
		const recentWithdrawals = await sql`
      SELECT 
        w.id, w.amount_requested, w.withdrawal_fee, w.amount_paid,
        w.status, w.payment_method, w.payment_reference,
        w.requested_at, w.processed_at,
        u.full_name, u.phone as user_phone
      FROM withdrawals w
      JOIN wallets wal ON w.wallet_id = wal.id
      JOIN users u ON wal.user_id = u.id
      ORDER BY w.requested_at DESC
      LIMIT 10
    `;
		const todayStats = await sql`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount_paid), 0) as total_paid
      FROM withdrawals
      WHERE DATE(requested_at) = CURRENT_DATE
        AND status IN ('completed', 'processing')
    `;
		return new Response(JSON.stringify({
			success: true,
			paychangu: paychanguBalance || { error: paychanguError },
			stats: {
				pending: {
					count: parseInt(totalPending?.count || "0"),
					totalAmount: parseFloat(totalPending?.total_requested || "0")
				},
				processing: {
					count: parseInt(totalProcessing?.count || "0"),
					totalAmount: parseFloat(totalProcessing?.total_requested || "0")
				},
				completed: {
					count: parseInt(totalCompleted?.count || "0"),
					totalAmount: parseFloat(totalCompleted?.total_requested || "0"),
					totalPaid: parseFloat(totalCompleted?.total_paid || "0"),
					totalFees: parseFloat(totalCompleted?.total_fees || "0")
				},
				failed: {
					count: parseInt(totalFailed?.count || "0"),
					totalAmount: parseFloat(totalFailed?.total_requested || "0")
				},
				today: {
					count: parseInt(todayStats[0]?.count || "0"),
					totalPaid: parseFloat(todayStats[0]?.total_paid || "0")
				}
			},
			recentWithdrawals: recentWithdrawals.map((w) => ({
				id: w.id,
				fullName: w.full_name,
				phone: w.user_phone,
				amountRequested: parseFloat(w.amount_requested || 0),
				fee: parseFloat(w.withdrawal_fee || 0),
				amountPaid: parseFloat(w.amount_paid || 0),
				status: w.status,
				paymentMethod: w.payment_method,
				chargeId: w.payment_reference,
				requestedAt: w.requested_at,
				processedAt: w.processed_at
			}))
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("PayChangu balance check error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/paychangu-balance@_@ts
var page = () => paychangu_balance_exports;
//#endregion
export { page };
