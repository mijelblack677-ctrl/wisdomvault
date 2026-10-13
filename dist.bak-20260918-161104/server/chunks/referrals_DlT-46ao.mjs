import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_Bo-Lmbfi.mjs";
//#region src/pages/api/vaultpro/referrals.ts
var referrals_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request, url }) => {
	try {
		await requireVaultPro(request);
		const sql = client;
		const referrals = await sql`
      SELECT
        r.id, r.referral_type, r.bonus_amount, r.is_paid, r.created_at,
        referrer.full_name as referrer_name, referrer.email as referrer_email,
        referred.full_name as referred_name, referred.email as referred_email
      FROM referrals r
      LEFT JOIN users referrer ON referrer.id = r.referrer_id
      LEFT JOIN users referred ON referred.id = r.referred_id
      ORDER BY r.created_at DESC
      LIMIT ${Math.min(parseInt(url.searchParams.get("limit") || "200"), 500)}
    `;
		const stats = await sql`
      SELECT
        referral_type,
        COUNT(*) as count,
        COALESCE(SUM(bonus_amount), 0) as total_bonus,
        COUNT(*) FILTER (WHERE is_paid = true) as paid_count,
        COALESCE(SUM(bonus_amount) FILTER (WHERE is_paid = true), 0) as total_paid
      FROM referrals
      GROUP BY referral_type
      ORDER BY referral_type
    `;
		const total = await sql`SELECT COUNT(*) as count FROM referrals`;
		return jsonResponse({
			success: true,
			referrals,
			stats,
			total: parseInt(total[0].count || "0")
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
//#region \0virtual:astro:page:src/pages/api/vaultpro/referrals@_@ts
var page = () => referrals_exports;
//#endregion
export { page };
