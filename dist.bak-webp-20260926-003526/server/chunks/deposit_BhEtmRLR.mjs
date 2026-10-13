import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/admin/deposit.ts
var deposit_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/**
* POST /api/admin/deposit
* Admin deposits funds into a user's wallet (admin investment/credit)
* 
* Body: { userId: string, amount: number, notes?: string }
*/
var POST = async ({ request }) => {
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
		const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
		if (sessions.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const adminId = sessions[0].admin_id;
		const rawBody = await request.text();
		const { userId, amount, notes } = JSON.parse(rawBody);
		if (!userId || !amount || amount <= 0) return new Response(JSON.stringify({
			success: false,
			message: "Valid user ID and positive amount required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const depositAmount = parseFloat(amount);
		const users = await sql`SELECT id, full_name FROM users WHERE id = ${userId}`;
		if (users.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "User not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const wallets = await sql`SELECT * FROM wallets WHERE user_id = ${userId}`;
		if (wallets.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Wallet not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const wallet = wallets[0];
		const currentBalance = parseFloat(wallet.balance_available || 0);
		const newBalance = currentBalance + depositAmount;
		await sql.begin(async (tx) => {
			await tx`
        UPDATE wallets
        SET balance_available = ${newBalance},
            gross_earnings = ${parseFloat(wallet.gross_earnings || 0) + depositAmount},
            gross_earnings_total = ${parseFloat(wallet.gross_earnings_total || 0) + depositAmount},
            updated_at = NOW()
        WHERE id = ${wallet.id}
      `;
			await tx`
        UPDATE users
        SET total_gross_earnings = COALESCE(total_gross_earnings, 0) + ${depositAmount},
            total_net_earnings = COALESCE(total_net_earnings, 0) + ${depositAmount}
        WHERE id = ${userId}
      `;
			await tx`
        INSERT INTO transactions (
          wallet_id, transaction_type, amount, fee_deducted, net_amount,
          balance_before, balance_after, description
        ) VALUES (
          ${wallet.id}, 'admin_deposit', ${depositAmount}, 0, ${depositAmount},
          ${currentBalance}, ${newBalance},
          ${"Admin deposit: MWK " + depositAmount.toLocaleString() + (notes ? " - " + notes : "")}
        )
      `;
			await tx`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${userId}, 'wallet_credit', '💰 Admin Deposit!',
          ${"MWK " + depositAmount.toLocaleString() + " has been credited to your wallet by admin." + (notes ? " Note: " + notes : "")},
          '/dashboard/wallet'
        )
      `;
			await tx`
        INSERT INTO audit_logs (admin_id, action, details)
        VALUES (
          ${adminId}, 'deposit',
          ${JSON.stringify({
				userId,
				amount: depositAmount,
				notes,
				newBalance
			})}::jsonb
        )
      `;
		});
		return new Response(JSON.stringify({
			success: true,
			message: `MWK ${depositAmount.toLocaleString()} deposited to ${users[0].full_name}'s wallet`,
			newBalance
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin deposit error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/deposit@_@ts
var page = () => deposit_exports;
//#endregion
export { page };
