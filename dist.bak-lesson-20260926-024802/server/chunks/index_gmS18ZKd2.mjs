import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as reconcileStuckWithdrawals } from "./withdrawalReconcile_BnVthpFs.mjs";
//#region src/pages/api/admin/withdrawals/index.ts
var withdrawals_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	PUT: () => PUT,
	prerender: () => false
});
var GET = async ({ request }) => {
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
	try {
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		try {
			await reconcileStuckWithdrawals();
		} catch (reconcileErr) {
			console.error("Admin withdrawals: reconcile sweep failed (continuing with stale data):", reconcileErr);
		}
		const withdrawalsWithDetails = (await sql`
      SELECT 
        w.id,
        w.wallet_id,
        w.amount_requested,
        w.withdrawal_fee,
        w.amount_paid,
        w.status,
        w.payment_method,
        w.payment_reference,
        w.notes,
        w.requested_at,
        w.processed_at,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone as user_phone,
        u.payment_status
      FROM withdrawals w
      JOIN wallets wal ON w.wallet_id = wal.id
      JOIN users u ON wal.user_id = u.id
      ORDER BY 
        CASE w.status 
          WHEN 'pending' THEN 1 
          WHEN 'processing' THEN 2
          WHEN 'completed' THEN 3 
          WHEN 'failed' THEN 4
          WHEN 'rejected' THEN 5 
        END,
        w.requested_at DESC
    `).map((w) => {
			let cardholderName = "—";
			let phoneNumber = w.user_phone || "—";
			if (w.notes) {
				const nameMatch = w.notes.match(/Name:\s*([^,]+)/);
				const phoneMatch = w.notes.match(/Phone:\s*([^.]+)/);
				if (nameMatch) cardholderName = nameMatch[1].trim();
				if (phoneMatch) phoneNumber = phoneMatch[1].trim().replace(/\s*Fee:.*$/, "").replace(/\s*Chunks:.*$/, "");
			}
			return {
				id: w.id,
				walletId: w.wallet_id,
				userId: w.user_id,
				full_name: w.full_name,
				email: w.email,
				user_phone: w.user_phone,
				cardholderName,
				phoneNumber,
				amount_requested: parseFloat(w.amount_requested || 0),
				withdrawal_fee: parseFloat(w.withdrawal_fee || 0),
				amount_paid: parseFloat(w.amount_paid || 0),
				status: w.status,
				payment_method: w.payment_method,
				payment_reference: w.payment_reference,
				notes: w.notes,
				requested_at: w.requested_at,
				processed_at: w.processed_at,
				payment_status: w.payment_status
			};
		});
		return new Response(JSON.stringify({
			success: true,
			withdrawals: withdrawalsWithDetails
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin withdrawals GET error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var PUT = async ({ request }) => {
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
	try {
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const { withdrawalId, status, notes } = await request.json();
		if (!withdrawalId || !status) return new Response(JSON.stringify({
			success: false,
			message: "Withdrawal ID and status required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const withdrawal = await sql`
      SELECT w.*, wal.user_id, wal.balance_available, wal.total_withdrawn, wal.fees_paid
      FROM withdrawals w
      JOIN wallets wal ON w.wallet_id = wal.id
      WHERE w.id = ${withdrawalId}
    `;
		if (withdrawal.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Withdrawal not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const w = withdrawal[0];
		if (status === "completed" && !["pending", "processing"].includes(w.status)) return new Response(JSON.stringify({
			success: false,
			message: `Cannot mark a withdrawal with status '${w.status}' as completed. Only 'pending' (manual) or 'processing' (awaiting confirmation) withdrawals can become completed.`
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (status === "completed" && w.status === "pending" && w.payment_method === "paychangu_mobile_money") return new Response(JSON.stringify({
			success: false,
			message: "Cannot manually approve a pending PayChangu auto-withdrawal. These are processed automatically."
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (status === "rejected" && !["pending", "processing"].includes(w.status)) return new Response(JSON.stringify({
			success: false,
			message: `Cannot reject a withdrawal with status '${w.status}'. Only 'pending' or stuck 'processing' withdrawals can be refunded.`
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (status === "rejected") {
			const refundAmount = parseFloat(w.amount_requested || 0);
			const currentBalance = parseFloat(w.balance_available || 0);
			const newBalance = currentBalance + refundAmount;
			const currentTotalWithdrawn = parseFloat(w.total_withdrawn || 0);
			const amountPaid = parseFloat(w.amount_paid || 0);
			const newTotalWithdrawn = Math.max(0, currentTotalWithdrawn - amountPaid);
			const currentFeesPaid = parseFloat(w.fees_paid || 0);
			const withdrawalFee = parseFloat(w.withdrawal_fee || 0);
			await sql`
        UPDATE wallets 
        SET balance_available = ${newBalance},
            total_withdrawn = ${newTotalWithdrawn},
            fees_paid = ${Math.max(0, currentFeesPaid - withdrawalFee)},
            updated_at = NOW()
        WHERE id = ${w.wallet_id}
      `;
			await sql`
        INSERT INTO transactions (
          wallet_id, 
          transaction_type, 
          amount, 
          fee_deducted,
          net_amount,
          balance_before, 
          balance_after, 
          description
        ) VALUES (
          ${w.wallet_id}, 
          'withdrawal_refund', 
          ${refundAmount}, 
          0,
          ${refundAmount},
          ${currentBalance}, 
          ${newBalance}, 
          ${`Withdrawal rejected - Amount refunded: MWK ${refundAmount.toLocaleString()}`}
        )
      `;
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${w.user_id}, 
          'withdrawal_rejected',
          '❌ Withdrawal Rejected',
          ${`Your withdrawal of MWK ${refundAmount.toLocaleString()} has been rejected. The amount has been refunded to your wallet.${notes ? " Reason: " + notes : ""}`},
          '/dashboard/wallet'
        )
      `;
		} else if (status === "completed") await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${w.user_id},
          ${w.status === "processing" ? "withdrawal_completed" : "withdrawal_approved"},
          '✅ Withdrawal Successful',
          ${w.status === "processing" ? `Your withdrawal of MWK ${parseFloat(w.amount_paid || 0).toLocaleString()} has been confirmed as sent to your mobile money wallet.` : `Your withdrawal of MWK ${parseFloat(w.amount_paid || 0).toLocaleString()} has been approved! You'll receive the money within 24-48 hours.`},
          '/dashboard/wallet'
        )
      `;
		const adminNote = status === "completed" && w.status === "processing" ? " | Admin confirmed payout reached the user (processing → completed). No refund." : notes ? " | Admin: " + notes : "";
		await sql`
      UPDATE withdrawals 
      SET status = ${status},
          processed_at = NOW(),
          notes = ${adminNote ? w.notes + adminNote : w.notes}
      WHERE id = ${withdrawalId}
    `;
		return new Response(JSON.stringify({
			success: true,
			message: `Withdrawal ${status} successfully`
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Update withdrawal error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/withdrawals/index@_@ts
var page = () => withdrawals_exports;
//#endregion
export { page };
