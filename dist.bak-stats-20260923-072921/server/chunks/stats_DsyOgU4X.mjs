import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/admin/stats.ts
var stats_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
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
		const totalUsers = await sql`SELECT COUNT(*) as count FROM users`;
		const totalEarnings = await sql`SELECT COALESCE(SUM(gross_earnings), 0) as total FROM wallets`;
		const pendingWithdrawals = await sql`SELECT COUNT(*) as count FROM withdrawals WHERE status = 'pending'`;
		const totalContent = await sql`SELECT COUNT(*) as count FROM content_items WHERE is_published = true`;
		const premiumPacks = await sql`SELECT COUNT(*) as count FROM premium_packs WHERE is_active = true`;
		const recentUsers = await sql`SELECT id, full_name, email, referral_code, is_founding_member, payment_status, created_at FROM users ORDER BY created_at DESC LIMIT 10`;
		const recentWithdrawals = await sql`
      SELECT w.*, u.full_name, u.email 
      FROM withdrawals w 
      JOIN wallets wa ON w.wallet_id = wa.id 
      JOIN users u ON wa.user_id = u.id 
      ORDER BY w.requested_at DESC LIMIT 10
    `;
		return new Response(JSON.stringify({
			success: true,
			stats: {
				totalUsers: parseInt(totalUsers[0].count),
				totalEarnings: parseFloat(totalEarnings[0].total),
				pendingWithdrawals: parseInt(pendingWithdrawals[0].count),
				totalContent: parseInt(totalContent[0].count),
				premiumPacks: parseInt(premiumPacks[0].count)
			},
			recentUsers,
			recentWithdrawals
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("💥 Admin stats error:", err.message);
		console.error("💥 Stack:", err.stack);
		return new Response(JSON.stringify({
			success: false,
			message: err.message,
			error: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/stats@_@ts
var page = () => stats_exports;
//#endregion
export { page };
