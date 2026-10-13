import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
//#region src/pages/api/public/stats.ts
var stats_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async () => {
	const sql = client;
	try {
		const bookCountRes = await sql`
      SELECT COUNT(*) as count FROM content_items
      WHERE is_published = true AND content_type = 'book'
    `;
		const guideCountRes = await sql`
      SELECT COUNT(*) as count FROM content_items
      WHERE is_published = true AND content_type = 'guide'
    `;
		const videoCountRes = await sql`
      SELECT COUNT(*) as count FROM content_items
      WHERE is_published = true AND content_type IN ('video', 'meditations', 'teaching', 'counsel')
    `;
		const audioCountRes = await sql`
      SELECT COUNT(*) as count FROM content_items
      WHERE is_published = true AND content_type = 'audio'
    `;
		const coursePackCountRes = await sql`
      SELECT COUNT(*) as count FROM premium_packs WHERE is_active = true
    `;
		const memberCountRes = await sql`
      SELECT COUNT(*) as count FROM users
    `;
		const configs = await sql`
      SELECT config_key, config_value
      FROM platform_config
      WHERE config_key IN (
        'registration_fee_mwk',
        'registration_fee_usd',
        'registration_fee_renewal',
        'referral_bonus_standard',
        'referral_bonus_founding',
        'referral_bonus_renewal',
        'withdrawal_min_amount',
        'withdrawal_fee_percent',
        'founding_member_limit',
        'refund_days'
      )
    `;
		const config = {};
		for (const c of configs) config[c.config_key] = c.config_value;
		const withdrawalMin = parseFloat(config["withdrawal_min_amount"] || "5000");
		const withdrawalFeePercent = parseFloat(config["withdrawal_fee_percent"] || "20");
		return new Response(JSON.stringify({
			success: true,
			stats: {
				bookCount: parseInt(bookCountRes[0]?.count || "0"),
				guideCount: parseInt(guideCountRes[0]?.count || "0"),
				videoCount: parseInt(videoCountRes[0]?.count || "0"),
				audioCount: parseInt(audioCountRes[0]?.count || "0"),
				coursePackCount: parseInt(coursePackCountRes[0]?.count || "0"),
				memberCount: parseInt(memberCountRes[0]?.count || "0"),
				registrationFeeMwk: parseFloat(config["registration_fee_mwk"] || "13000"),
				registrationFeeUsd: parseFloat(config["registration_fee_usd"] || "8"),
				registrationFeeRenewal: parseFloat(config["registration_fee_renewal"] || "5000"),
				referralBonusStandard: parseFloat(config["referral_bonus_standard"] || "7000"),
				referralBonusFounding: parseFloat(config["referral_bonus_founding"] || "7000"),
				referralBonusRenewal: parseFloat(config["referral_bonus_renewal"] || "1000"),
				withdrawalMinAmount: withdrawalMin,
				withdrawalMaxAmount: 15e5,
				withdrawalFeePercent,
				foundingMemberLimit: parseInt(config["founding_member_limit"] || "100"),
				refundDays: parseInt(config["refund_days"] || "7"),
				usdRate: 1800
			}
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Public stats error:", err);
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
//#region \0virtual:astro:page:src/pages/api/public/stats@_@ts
var page = () => stats_exports;
//#endregion
export { page };
