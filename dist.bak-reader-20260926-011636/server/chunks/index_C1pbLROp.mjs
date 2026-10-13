import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as isAuthorizedUser } from "./auth-check_HAPvz2t0.mjs";
//#region src/pages/api/wallet/withdrawals/index.ts
var withdrawals_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const userId = new URL(request.url).searchParams.get("userId");
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "User ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!await isAuthorizedUser(request, userId)) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const wallet = await sql`
      SELECT id FROM wallets WHERE user_id = ${userId}
    `;
		if (wallet.length === 0) return new Response(JSON.stringify({
			success: true,
			withdrawals: []
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
		const withdrawals = await sql`
      SELECT 
        id,
        amount_requested,
        withdrawal_fee,
        amount_paid,
        status,
        payment_method,
        payment_reference,
        notes,
        requested_at,
        processed_at
      FROM withdrawals
      WHERE wallet_id = ${wallet[0].id}
      ORDER BY requested_at DESC
    `;
		return new Response(JSON.stringify({
			success: true,
			withdrawals: withdrawals.map((w) => ({
				id: w.id,
				amountRequested: parseFloat(w.amount_requested || 0),
				withdrawalFee: parseFloat(w.withdrawal_fee || 0),
				amountPaid: parseFloat(w.amount_paid || 0),
				status: w.status,
				paymentMethod: w.payment_method,
				paymentReference: w.payment_reference,
				notes: w.notes,
				requestedAt: w.requested_at,
				processedAt: w.processed_at
			}))
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("User withdrawals GET error:", err);
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
//#region \0virtual:astro:page:src/pages/api/wallet/withdrawals/index@_@ts
var page = () => withdrawals_exports;
//#endregion
export { page };
