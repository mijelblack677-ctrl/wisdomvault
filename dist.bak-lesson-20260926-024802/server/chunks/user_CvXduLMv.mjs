import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_q5zMPqoV.mjs";
//#region src/pages/api/vaultpro/user.ts
var user_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request, url }) => {
	try {
		await requireVaultPro(request);
		const sql = client;
		const id = url.searchParams.get("id") || "";
		if (!id) return jsonResponse({
			success: false,
			message: "User id required"
		}, 400);
		const users = await sql`
      SELECT
        u.id, u.full_name, u.email, u.phone, u.referral_code,
        u.referred_by, u.payment_status, u.is_active, u.is_founding_member,
        u.founding_member_number, u.registration_year, u.renewal_due_date,
        u.created_at, u.updated_at,
        u.total_gross_earnings, u.total_fees_paid, u.total_net_earnings,
        u.fee_chunks_count,
        w.balance_available, w.store_credit, w.gross_earnings,
        w.gross_earnings_total, w.total_withdrawn, w.fees_paid
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.id = ${id}
    `;
		if (users.length === 0) return jsonResponse({
			success: false,
			message: "User not found"
		}, 404);
		const user = users[0];
		try {
			user.consent_given_at = (await sql`SELECT consent_given_at FROM users WHERE id = ${user.id}`)[0]?.consent_given_at ?? null;
		} catch {
			user.consent_given_at = null;
		}
		let upline = null;
		if (user.referred_by) upline = (await sql`
        SELECT u.id, u.full_name, u.email, u.phone, u.referral_code, u.payment_status, u.is_active,
               w.balance_available, w.store_credit
        FROM users u
        LEFT JOIN wallets w ON w.user_id = u.id
        WHERE u.id = ${user.referred_by}
      `)[0] || null;
		const downline = await sql`
      SELECT u.id, u.full_name, u.email, u.phone, u.referral_code,
             u.payment_status, u.is_active, u.created_at,
             w.balance_available, w.store_credit
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.referred_by = ${user.id}
      ORDER BY u.created_at DESC
      LIMIT 100
    `;
		const transactions = await sql`
      SELECT t.*
      FROM transactions t
      JOIN wallets w ON w.id = t.wallet_id
      WHERE w.user_id = ${user.id}
      ORDER BY t.created_at DESC
      LIMIT 100
    `;
		const referrals = await sql`
      SELECT r.id, r.referral_type, r.bonus_amount, r.is_paid, r.created_at,
             u.full_name as referred_name, u.email as referred_email
      FROM referrals r
      LEFT JOIN users u ON u.id = r.referred_id
      WHERE r.referrer_id = ${user.id}
      ORDER BY r.created_at DESC
      LIMIT 100
    `;
		return jsonResponse({
			success: true,
			user,
			upline,
			downline,
			transactions,
			referrals
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
//#region \0virtual:astro:page:src/pages/api/vaultpro/user@_@ts
var page = () => user_exports;
//#endregion
export { page };
