import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { n as readJson, r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_q5zMPqoV.mjs";
//#region src/pages/api/vaultpro/unverified.ts
var unverified_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
/**
* GET  /api/vaultpro/unverified?days=3  → list unverified users older than N days
* POST /api/vaultpro/unverified         → body { days: 3, userIds?: string[] } deletes them
*/
var GET = async ({ request, url }) => {
	try {
		await requireVaultPro(request);
		const sql = client;
		const days = Math.max(parseInt(url.searchParams.get("days") || "3"), 0);
		const users = await sql`
      SELECT
        u.id, u.full_name, u.email, u.phone, u.referral_code,
        u.created_at,
        (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = u.id) as referral_count
      FROM users u
      WHERE u.payment_status = 'pending'
        AND u.is_active = true
        AND u.created_at < NOW() - make_interval(0, 0, 0, ${days})
      ORDER BY u.created_at ASC
    `;
		const total = await sql`
      SELECT COUNT(*) as count FROM users
      WHERE payment_status = 'pending' AND is_active = true
    `;
		return jsonResponse({
			success: true,
			days,
			users,
			count: users.length,
			totalUnverified: parseInt(total[0].count || "0")
		});
	} catch (error) {
		if (error instanceof Response) return error;
		return jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
};
var POST = async ({ request }) => {
	try {
		const admin = await requireVaultPro(request);
		const sql = client;
		const body = await readJson(request);
		const days = Math.max(parseInt(body.days || "3"), 0);
		const users = await sql`
      SELECT u.id, u.full_name, u.email FROM users u
      WHERE u.payment_status = 'pending' AND u.is_active = true AND ${body.userIds && body.userIds.length ? sql`u.id IN ${sql(body.userIds)}` : sql`u.created_at < NOW() - make_interval(0, 0, 0, ${days})`}
    `;
		const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
		const existing = new Set(tables.map((t) => t.tablename));
		const dependent = [
			["course_progress", "user_id"],
			["user_sponsored_views", "user_id"],
			["user_content_purchases", "user_id"],
			["user_premium_packs", "user_id"],
			["course_purchases", "user_id"],
			["notifications", "user_id"],
			["referral_earnings", "user_id"],
			["fee_chunks", "user_id"],
			["payment_proofs", "user_id"],
			["audit_logs", "user_id"],
			["earn_content_views", "user_id"],
			["password_reset_tokens", "user_id"],
			["user_sessions", "user_id"]
		];
		let deleted = 0;
		let failed = 0;
		const failedUsers = [];
		for (const u of users) try {
			await sql.begin(async (tx) => {
				for (const [table, col] of dependent) if (existing.has(table)) try {
					await tx`DELETE FROM ${tx(table)} WHERE ${tx(col)} = ${u.id}`;
				} catch {}
				try {
					await tx`DELETE FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ${u.id})`;
				} catch {}
				try {
					await tx`DELETE FROM withdrawals WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ${u.id})`;
				} catch {}
				try {
					await tx`DELETE FROM referrals WHERE referrer_id = ${u.id} OR referred_id = ${u.id}`;
				} catch {}
				try {
					await tx`DELETE FROM wallets WHERE user_id = ${u.id}`;
				} catch {}
				await tx`DELETE FROM users WHERE id = ${u.id}`;
			});
			deleted++;
		} catch (e) {
			failed++;
			failedUsers.push(`${u.full_name} (${u.email})`);
			console.error("Unverified delete failed for", u.id, e);
		}
		await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${admin.id}, 'vaultpro_delete_unverified',
              ${JSON.stringify({
			days,
			deleted,
			failed,
			failedUsers: failedUsers.slice(0, 10)
		})}::jsonb)
    `;
		return jsonResponse({
			success: true,
			message: `Deleted ${deleted} unverified users${failed ? ` (${failed} failed)` : ""}`,
			deleted,
			failed,
			failedUsers: failedUsers.slice(0, 10)
		});
	} catch (error) {
		if (error instanceof Response) return error;
		return jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/vaultpro/unverified@_@ts
var page = () => unverified_exports;
//#endregion
export { page };
