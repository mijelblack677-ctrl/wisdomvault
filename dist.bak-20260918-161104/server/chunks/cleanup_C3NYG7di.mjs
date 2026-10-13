import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { n as readJson, r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_Bo-Lmbfi.mjs";
//#region src/pages/api/vaultpro/cleanup.ts
var cleanup_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/**
* POST /api/vaultpro/cleanup
* Body: { days?: number, dryRun?: boolean }
*
* Mirrors cleanup_7days.py:
*  1. Delete notifications older than N days
*  2. Delete earn_content older than N days
*  3. Delete unverified users older than N days (with their dependent data)
*/
var POST = async ({ request }) => {
	try {
		const admin = await requireVaultPro(request);
		const sql = client;
		const body = await readJson(request);
		const days = Math.max(parseInt(body.days || "7"), 1);
		const dryRun = body.dryRun === true;
		const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
		const existing = new Set(tables.map((t) => t.tablename));
		let oldNotifications = 0;
		let oldEarnContent = 0;
		let oldUnverified = 0;
		if (existing.has("notifications")) {
			const r = await sql`
        SELECT COUNT(*) as count FROM notifications
        WHERE created_at < NOW() - make_interval(0, 0, 0, ${days})
      `;
			oldNotifications = parseInt(r[0].count || "0");
		}
		if (existing.has("earn_content")) {
			const r = await sql`
        SELECT COUNT(*) as count FROM earn_content
        WHERE created_at < NOW() - make_interval(0, 0, 0, ${days})
      `;
			oldEarnContent = parseInt(r[0].count || "0");
		}
		const unv = await sql`
      SELECT COUNT(*) as count FROM users
      WHERE payment_status = 'pending' AND is_active = true
        AND created_at < NOW() - make_interval(0, 0, 0, ${days})
    `;
		oldUnverified = parseInt(unv[0].count || "0");
		if (dryRun) return jsonResponse({
			success: true,
			dryRun: true,
			days,
			oldNotifications,
			oldEarnContent,
			oldUnverified,
			total: oldNotifications + oldEarnContent + oldUnverified
		});
		let deletedNotifications = 0;
		if (existing.has("notifications")) deletedNotifications = (await sql`
        DELETE FROM notifications
        WHERE created_at < NOW() - make_interval(0, 0, 0, ${days})
      `).length;
		let deletedEarnContent = 0;
		if (existing.has("earn_content")) deletedEarnContent = (await sql`
        DELETE FROM earn_content
        WHERE created_at < NOW() - make_interval(0, 0, 0, ${days})
      `).length;
		const unverifiedUsers = await sql`
      SELECT id, full_name, email FROM users
      WHERE payment_status = 'pending' AND is_active = true
        AND created_at < NOW() - make_interval(0, 0, 0, ${days})
    `;
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
		let deletedUsers = 0;
		let failedUsers = 0;
		for (const u of unverifiedUsers) try {
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
			deletedUsers++;
		} catch (e) {
			failedUsers++;
			console.error("Cleanup user delete failed:", u.id, e);
		}
		await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${admin.id}, 'vaultpro_7day_cleanup',
              ${JSON.stringify({
			days,
			deletedNotifications,
			deletedEarnContent,
			deletedUsers,
			failedUsers
		})}::jsonb)
    `;
		return jsonResponse({
			success: true,
			days,
			deletedNotifications,
			deletedEarnContent,
			deletedUsers,
			failedUsers,
			total: deletedNotifications + deletedEarnContent + deletedUsers
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
//#region \0virtual:astro:page:src/pages/api/vaultpro/cleanup@_@ts
var page = () => cleanup_exports;
//#endregion
export { page };
