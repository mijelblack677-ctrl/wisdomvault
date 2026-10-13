import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
//#region src/pages/api/referral/stats/index.ts
var stats_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get("userId");
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "User ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const user = await sql`
      SELECT id, full_name, referral_code FROM users WHERE id = ${userId}
    `;
		if (user.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "User not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		console.log("🔍 Fetching referrals for user:", userId);
		const allReferrals = await sql`
      SELECT 
        r.id,
        r.referral_type,
        r.bonus_amount,
        r.fee_deducted,
        r.net_amount,
        r.is_paid,
        r.created_at,
        r.registration_year,
        r.referrer_id,
        r.referred_id,
        u.full_name as referred_name,
        u.email as referred_email,
        u.payment_status as referred_payment_status,
        u.phone as referred_phone
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = ${userId}
      ORDER BY r.created_at DESC
    `;
		console.log("📊 Found referrals:", allReferrals.length);
		const firstLevel = allReferrals.filter((r) => r.referral_type === "first_level" || r.referral_type === "registration");
		const secondLevel = allReferrals.filter((r) => r.referral_type === "second_level");
		const totalReferrals = allReferrals.length;
		const paidReferrals = allReferrals.filter((r) => r.is_paid).length;
		const pendingReferrals = allReferrals.filter((r) => !r.is_paid).length;
		const totalGross = allReferrals.reduce((sum, r) => sum + parseFloat(r.bonus_amount || 0), 0);
		const totalFees = allReferrals.reduce((sum, r) => sum + parseFloat(r.fee_deducted || 0), 0);
		const totalNet = allReferrals.reduce((sum, r) => sum + parseFloat(r.net_amount || 0), 0);
		const baseUrl = process.env.PUBLIC_APP_URL || url.origin || "https://wisdomvault.app";
		const referralLink = user[0].referral_code ? `${baseUrl}/register?ref=${user[0].referral_code}` : "";
		return new Response(JSON.stringify({
			success: true,
			stats: {
				totalReferrals,
				paidReferrals,
				pendingReferrals,
				totalGross,
				totalFees,
				totalNet
			},
			firstLevelReferrals: firstLevel.map((r) => ({
				id: r.id,
				referral_type: r.referral_type,
				bonus_amount: parseFloat(r.bonus_amount || 0),
				fee_deducted: parseFloat(r.fee_deducted || 0),
				net_amount: parseFloat(r.net_amount || 0),
				is_paid: r.is_paid,
				created_at: r.created_at,
				registration_year: r.registration_year,
				referred_name: r.referred_name || "Anonymous",
				referred_email: r.referred_email || "",
				referred_payment_status: r.referred_payment_status,
				referred_phone: r.referred_phone || ""
			})),
			secondLevelReferrals: secondLevel.map((r) => ({
				id: r.id,
				referral_type: r.referral_type,
				bonus_amount: parseFloat(r.bonus_amount || 0),
				fee_deducted: parseFloat(r.fee_deducted || 0),
				net_amount: parseFloat(r.net_amount || 0),
				is_paid: r.is_paid,
				created_at: r.created_at,
				registration_year: r.registration_year,
				referred_name: r.referred_name || "Anonymous",
				referred_email: r.referred_email || "",
				referred_payment_status: r.referred_payment_status,
				referred_phone: r.referred_phone || ""
			})),
			referralLink,
			referralCode: user[0].referral_code || ""
		}), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache, no-store, must-revalidate"
			}
		});
	} catch (error) {
		const err = error;
		console.error("❌ Referral stats error:", err);
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
//#region \0virtual:astro:page:src/pages/api/referral/stats/index@_@ts
var page = () => stats_exports;
//#endregion
export { page };
