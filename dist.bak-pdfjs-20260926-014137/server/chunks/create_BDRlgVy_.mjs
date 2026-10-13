import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { n as unauthorized, t as requireAdmin } from "./adminAuth_Dr_-tb6j.mjs";
//#region src/pages/api/referral/create.ts
var create_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		if (!await requireAdmin(request)) return unauthorized("Admin authentication required");
		const rawBody = await request.text();
		const { referrerId, referredId } = JSON.parse(rawBody);
		if (!referrerId || !referredId) return new Response(JSON.stringify({
			success: false,
			message: "Referrer ID and Referred ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (referrerId === referredId) return new Response(JSON.stringify({
			success: false,
			message: "Cannot refer yourself"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		if ((await sql`
      SELECT id FROM referrals 
      WHERE referrer_id = ${referrerId} AND referred_id = ${referredId}
    `).length > 0) return new Response(JSON.stringify({
			success: false,
			message: "Referral already recorded"
		}), {
			status: 409,
			headers: { "Content-Type": "application/json" }
		});
		const referrerCheck = await sql`
      SELECT id, is_founding_member FROM users WHERE id = ${referrerId}
    `;
		if (referrerCheck.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Referrer not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const bonusConfig = await sql`
      SELECT config_key, config_value FROM platform_config
      WHERE config_key IN ('referral_bonus_standard', 'referral_bonus_founding')
    `;
		const bonusMap = {};
		for (const c of bonusConfig) bonusMap[c.config_key] = c.config_value;
		const standardBonus = parseFloat(bonusMap["referral_bonus_standard"] || "7000");
		const foundingBonus = parseFloat(bonusMap["referral_bonus_founding"] || "7000");
		const level1Bonus = referrerCheck[0].is_founding_member ? foundingBonus : standardBonus;
		const referralResult = await sql`
      INSERT INTO referrals (
        referrer_id, 
        referred_id, 
        referral_type, 
        bonus_amount, 
        fee_deducted, 
        net_amount, 
        registration_year, 
        is_paid,
        created_at
      ) VALUES (
        ${referrerId}, 
        ${referredId}, 
        'first_level',  -- ✅ Use 'first_level' not 'registration'
        ${level1Bonus},  -- ✅ Bonus from platform_config
        0, 
        ${level1Bonus}, 
        ${(/* @__PURE__ */ new Date()).getFullYear()}, 
        false,
        NOW()
      )
      RETURNING id
    `;
		return new Response(JSON.stringify({
			success: true,
			message: "Referral recorded. Bonus will be credited after user verification.",
			referralId: referralResult[0].id,
			status: "pending_verification"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Referral creation error:", err);
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
//#region \0virtual:astro:page:src/pages/api/referral/create@_@ts
var page = () => create_exports;
//#endregion
export { page };
